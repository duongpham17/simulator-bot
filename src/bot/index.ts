import Bots, { IBotOrder, IBots } from '../model/bots';
import Orders from '../model/orders';
import Prices from '../model/prices';
import Simulators from '../model/simulators';

import { kucoin } from '../@api/kucoin';
import { second_till_zero, is_object_empty } from '../@utils/functions'; 
import { buy_or_sell } from './functions';

const setup_trade = async ({ data }: { data: IBots }) => {
    const { used_strategy } = data;

    const KucoinLive = kucoin({
        symbol: used_strategy.market_id.toUpperCase(), 
        api_key: used_strategy.api_key, 
        secret_key: used_strategy.secret_key, 
        passphrase: used_strategy.passphrase
    });

    const price = await KucoinLive.getPrice() as number;

    await Prices.create({price, simulator: data.simulator, createdAt: new Date});

    return {
        price,
        KucoinLive,
    }
};

const reset_trade = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
    const { used_strategy } = data;

    const isReset = used_strategy.reset > 0 ? second_till_zero(used_strategy.reset) <= 2 : false;

    if(!isReset) return false;

    await Bots.findByIdAndUpdate(data._id, {price_snapshot: price}, {new: true});
    
    return true;
};

const close_trade = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
    const { order, used_strategy } = data;

    const profit_loss =  order.side === "buy" 
        ? Number( (price - order.open_price) * used_strategy.position_size)
        : Number( (order.open_price - price) * used_strategy.position_size)

    const closed_order = {
        ...order, 
        simulator: data.simulator,
        user: data.user,
        close_price: price,
        closedAt: new Date,
        live: used_strategy.live,
        profit_loss,
        used_strategy: used_strategy,
    };

    const save_order = await Orders.create(closed_order);

    if(!save_order) return false;

    await Bots.findByIdAndUpdate(data._id, {
            price_snapshot: price, 
            order: {}, 
            $push: {orders: save_order} 
        }, 
        { new: true }
    );

    return true;
};

const update_trade = async ({ data, price }: { data: IBots, price: number}): Promise<boolean> => {
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

const open_trade = async ({ data, price, side, clientOid }: { data: IBots, price: number, side: "buy" | "sell", clientOid: string}): Promise<boolean> => {
    const { used_strategy } = data;

    const order: IBotOrder = {
        clientOid,
        side,
        moving_price: price,
        open_price: price,
        market_id: used_strategy.market_id,
        stop_loss: side === "buy" ? (price - used_strategy.stop_loss) : (price + used_strategy.stop_loss),
        take_profit: side === "buy" ? (price + used_strategy.take_profit) : (price - used_strategy.take_profit),
        createdAt: new Date(),
    }

    await Bots.findByIdAndUpdate(data._id,{ order }, {new: true});

    return false;
};

const end_trade = async ({ data, price, isOrderOpen, KucoinLive }: { data: IBots, price: number, isOrderOpen: boolean, KucoinLive: any}): Promise<boolean> => {
    const { used_strategy, order, stop, orders } = data;

    const is_end_trade = orders.length >= used_strategy.max_orders || stop;

    if(is_end_trade){       
        if(isOrderOpen) {
            if(used_strategy.live) await KucoinLive.closePosition(order.clientOid);
            await close_trade({ data, price });
        }
        await Simulators.findByIdAndUpdate(data.simulator, {running: false, closedAt: new Date}, {new: true});
        await Bots.findByIdAndDelete(data._id);

        return true;
    }

    return false;
};

const stop_loss_hit = async ({ data, price, KucoinLive }: { data: IBots, price: number, KucoinLive: any}): Promise<boolean> => {
    const { order, used_strategy } = data;

    const isStopLoss = order.side === "buy" ? (order.stop_loss > price) : (price > order.stop_loss);
    if(!isStopLoss) return false;

    if(used_strategy.live) await KucoinLive.closePosition(order.clientOid);
    const isClosed = await close_trade({ data, price });
    if(isClosed) return true;

    return false;
}

const take_profit_hit = async ({ data, price, KucoinLive }: { data: IBots, price: number, KucoinLive: any}): Promise<boolean> => {
    const { order, used_strategy } = data;

    const isTakeProfit = order.side === "buy" ? (price > order.take_profit) : (order.take_profit > price);
    if(!isTakeProfit) return false;

    if(used_strategy.trailing_take_profit === false){
        if(used_strategy.live) await KucoinLive.closePosition(order.clientOid);
        const isClosed = await close_trade({ data, price });
        if(isClosed) return true;
    };

    if(used_strategy.trailing_take_profit === true){
        const isUpdated = await update_trade({ data, price});
        if(isUpdated) return true;
    };

    return false;
};

const live_trade_environment = async ({ data, price, side, KucoinLive }: { data: IBots, price: number, side: "buy" | "sell" , KucoinLive: any}): Promise<boolean> => {
    const { used_strategy } = data;

    const position = await KucoinLive.placePosition({ side, price, usdtBalance: used_strategy.usdt_balance, size: used_strategy.position_size, leverage: used_strategy.leverage });
    if(!position){
        await Bots.findByIdAndDelete(data._id);
        await Simulators.findByIdAndUpdate(data.simulator, {message: "error", running: false}, {new: true});
        return true
    };
    if(position){
        const opened = await open_trade({ data, price, side, clientOid: position.clientOid});
        if(opened) return true
    };

    return false;
}

const test_trade_environment = async ({ data, price, side }: { data: IBots, price: number, side: "buy" | "sell"}): Promise<boolean> => {

    const clientOid = "01010101-"+(Math.random() * 100000000000).toString()+"-01010101";

    const opened = await open_trade({ data, price, side, clientOid});

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

            const { used_strategy, order } = x;

            const { KucoinLive, price } = await setup_trade({ data: x });

            const isOrderOpen = is_object_empty(order) ? false : true;

            const end_script = await end_trade({ data: x, price, isOrderOpen, KucoinLive });
            if(end_script) continue;

            if(isOrderOpen){
                const stop_loss = await stop_loss_hit({ data: x, price, KucoinLive });
                if(stop_loss) continue;

                const take_profit = await take_profit_hit({ data: x, price, KucoinLive });
                if(take_profit) continue;

                continue;
            };

            const reset_used = await reset_trade({ data: x, price });
            if(reset_used) continue;

            const {isNoSide, side} = buy_or_sell({ strategy: used_strategy, price_current: price, price_snapshot: x.price_snapshot });
            if(isNoSide) continue;

            if(used_strategy.live === true){
                const live_order = await live_trade_environment({ data: x, price, side, KucoinLive });
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