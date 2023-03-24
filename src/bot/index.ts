import Bots, { IBotOrder, IBots } from '../model/bots';
import Orders from '../model/orders';
import Prices from '../model/prices';
import Simulators, { ISimulators } from '../model/simulators';

import { kucoin, kucoin_symbol_price } from '../@api/kucoin';
import { second_till_zero, is_object_empty } from '../@utils/functions'; 
import { buy_or_sell } from './functions';

const bot_open_order = async ({data, side, orderId, price}:{data: IBots, side: "buy" | "sell", orderId: string, price: number}) => {

    const { used_strategy } = data;

    const order: IBotOrder = {
        orderId,
        side,
        moving_price: price,
        open_price: price,
        market_id: used_strategy.market_id,
        stop_loss: side === "buy" ? (price - used_strategy.stop_loss) : (price + used_strategy.stop_loss),
        take_profit: side === "buy" ? (price + used_strategy.take_profit) : (price - used_strategy.take_profit),
        createdAt: new Date(),
    }

    const bots = await Bots.findByIdAndUpdate(data._id,{ order }, {new: true});

    if(!bots) return false

    return true;
};

const bot_close_order = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
    const { order, used_strategy } = data;

    const profit_loss =  order.side === "buy" 
        ? Number( (price - order.open_price) * used_strategy.position_size)
        : Number( (order.open_price - price) * used_strategy.position_size)

    const closed_order = {
        ...order,
        user: data.user,
        bots: data._id,
        close_price: price,
        closedAt: new Date,
        live: used_strategy.live,
        profit_loss,
        used_strategy: used_strategy,
    };

    const save_order = await Orders.create(closed_order);

    if(!save_order) return false;

    const bots = await Bots.findByIdAndUpdate(data._id, {
            price_snapshot: price, 
            order: {}, 
            $push: {orders: save_order} 
        }, 
        { new: true }
    );

    if(!bots) return false;

    return true;
};

const bot_update_order = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
    const { used_strategy, order } = data;

    if(!order) return false;

    const n_order = {
        ...order,
        stop_loss: order.side === "buy" ? order.stop_loss + used_strategy.stop_loss : order.stop_loss - used_strategy.stop_loss,
        take_profit:  order.side === "buy" ? order.take_profit + used_strategy.take_profit : order.take_profit - used_strategy.take_profit,
        moving_price: price
    };

    const updated = await Bots.findByIdAndUpdate(data._id, {order: n_order}, {new: true});

    return updated ? true : false;
};

const exchange_market_price = async (data: IBots): Promise<{price: number, createdAt: Date} | null > => {
    const { used_strategy } = data;

    let prices: {price: number, createdAt: Date} | null = null;

    if(used_strategy.exchange === "kucoin"){
        const response = await kucoin_symbol_price(used_strategy.market_id);
        if(response) prices = response;
        if(!response) prices = null
    };

    await Prices.create(prices);
    
    return prices;
};

const exchange_close_position = async ({ data }: { data: IBots }): Promise<Boolean> => {
    const { used_strategy, order } = data;

    if(used_strategy.exchange === "kucoin"){
        const API = kucoin({
            symbol: used_strategy.market_id.toUpperCase(), 
            api_key: used_strategy.api_key, 
            secret_key: used_strategy.secret_key, 
            passphrase: used_strategy.passphrase
        });
        const position_close = await API.closePosition(order.orderId);
        if(!position_close) return false;
        const position = await API.getPosition(position_close.orderId);
        if(!position) return false;
        const close = await bot_close_order({ 
            data, 
            price: (position.dealValue/position.size) / 10, // exit price
        });
        if(!close) return false;
        return true
    };

    return false
}

const exchange_place_position = async ({ data, side, price }: { data: IBots, side: "buy" | "sell", price: number }): Promise<Boolean> => {
    const { used_strategy } = data;

    if(used_strategy.exchange === "kucoin"){
        const API = kucoin({
            symbol: used_strategy.market_id.toUpperCase(), 
            api_key: used_strategy.api_key, 
            secret_key: used_strategy.secret_key, 
            passphrase: used_strategy.passphrase
        });
        const position_place = await API.placePosition({
            side, price,
            leverage: used_strategy.leverage, 
            size: used_strategy.position_size 
        });
        if(!position_place) return false;

        const position = await API.getPosition(position_place.orderId);
        if(!position) return false;
        const order = await bot_open_order({
            data,
            side: position.side,
            price: (position.dealValue/position.size) / 10, // entry price
            orderId: position.id,
        })
        if(!order) return false;
        return true;
    };

    return false
}

const reset_timer_trade = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
    const { used_strategy } = data;

    const isReset = used_strategy.reset > 0 ? second_till_zero(used_strategy.reset) <= 2 : false;

    if(!isReset) return false;

    const bots = await Bots.findByIdAndUpdate(data._id, {price_snapshot: price}, {new: true});

    if(!bots) return false;
    
    return true;
};

const end_bot = async ({ data, message, isOrderOpen }: { data: IBots, isOrderOpen: boolean, message: ISimulators["message"]}): Promise<boolean> => {
    const { used_strategy, stop, orders } = data;

    const is_end_trade = orders.length >= used_strategy.max_orders || stop;

    if(!is_end_trade) return false;

    if(isOrderOpen) await exchange_close_position({ data })

    const simulator = await Simulators.create({
        bots: data._id,
        user: data.user,
        strategy: data.strategy,
        message: message,
        used_strategy: data.used_strategy,
        live: data.used_strategy.live,
        market_id: data.used_strategy.market_id,
        synced: false,
        orders: [],
        createdAt: data.createdAt,
        closedAt: new Date, 
    });

    const deleted = await Bots.findByIdAndDelete(data._id, {new : true});

    if(deleted && simulator) return true;

    return false;
};

const stop_loss_hit = async ({ data, price }: { data: IBots, price: number }): Promise<boolean> => {
    const { order, used_strategy } = data;

    const isStopLoss = order.side === "buy" ? (order.stop_loss > price) : (price > order.stop_loss);
    if(!isStopLoss) return false;

    if(used_strategy.live) {
        const isClosed = await exchange_close_position({ data })
        if(isClosed) return true;
        return false;
    } else {
        const isClosed = await bot_close_order({ data, price });
        if(isClosed) return true;
        return false;
    }
}

const take_profit_hit = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
    const { order, used_strategy } = data;

    const isTakeProfit = order.side === "buy" ? (price > order.take_profit) : (order.take_profit > price);
    if(!isTakeProfit) return false;

    if(used_strategy.trailing_take_profit){
        if(used_strategy.live) {
            const isClosed = await exchange_close_position({ data })
            if(isClosed) return true;
            return false;
        } else {
            const isClosed = await bot_close_order({ data, price });
            if(isClosed) return true;
            return false;
        }
    } else {
        const isUpdated = await bot_update_order({ data, price});
        if(isUpdated) return true;
    }

    return false
};

const live_trade_environment = async ({ data, price, side }: { data: IBots, price: number, side: "buy" | "sell"}): Promise<boolean> => {
    const opened = await exchange_place_position({ data, price, side });

    if(opened) return true;

    await end_bot({data, message: "error", isOrderOpen: false});
    
    return false
}

const test_trade_environment = async ({ data, price, side }: { data: IBots, price: number, side: "buy" | "sell"}): Promise<boolean> => {
    const orderId = "01010101-"+(Math.random() * 100000000000).toString()+"-01010101";

    const opened = await bot_open_order({ data, price, side, orderId});

    if(opened) return true;

    return false;
};

const robot = () => {

    setInterval(async () => {
        
        const trades = await Bots.find();

        if(!trades || !trades.length) return console.log(`No trades`);

        console.log(`-----------------------------------------------`);
        console.log(`${trades.length} trades`);

        for(let x of trades){

            const crypto  = await exchange_market_price(x);
            if(!crypto) continue;

            const { used_strategy, order } = x;
            
            const { price } = crypto;

            const isOrderOpen = is_object_empty(order) ? false : true;

            const end_script = await end_bot({ data: x, isOrderOpen, message: "success" });
            if(end_script) continue;

            if(isOrderOpen){
                const stop_loss = await stop_loss_hit({ data: x, price });
                if(stop_loss) continue;

                const take_profit = await take_profit_hit({ data: x, price });
                if(take_profit) continue;

                continue;
            }

            const reset_used = await reset_timer_trade({ data: x, price });
            if(reset_used) continue;

            const {isNoSide, side} = buy_or_sell({ strategy: used_strategy, price_current: price, price_snapshot: x.price_snapshot });
            if(isNoSide) continue;

            if(used_strategy.live === true){
                const live_order = await live_trade_environment({ data: x, price, side });
                if(live_order) continue;
            };
            
            if(used_strategy.live === false){
                const test_order = await test_trade_environment({ data: x, price, side });
                if(test_order) continue;
            };
            
        };

    }, 5000);

}

export default robot;