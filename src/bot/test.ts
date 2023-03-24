import Bots, { IBotOrder, IBots } from '../model/bots';
import Orders from '../model/orders';
import Prices from '../model/prices';

import { kucoin, kucoin_symbol_price } from '../@api/kucoin';

interface OpenOrderProps {
    data: IBots,
    side: "buy" | "sell",
    orderId: string,
    price: number,
}

const bot_open_order = async ({data, side, orderId, price}:OpenOrderProps) => {

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

const exchange_market_price = async (data: IBots): Promise<{price: number, createdAt: Date} | null > => {
    const { used_strategy } = data;

    if(used_strategy.exchange === "kucoin"){
        const response = await kucoin_symbol_price(used_strategy.market_id);
        if(response) return response
    };
    
    return null;
};

interface ExchangeApiProps {
    data: IBots,
    actions: "open" | "close",
    side: "buy" | "sell",
    price: number,
};

const exchange_futures_api = async ({ data, actions, side, price }: ExchangeApiProps): Promise<Boolean> => {
    const { used_strategy, order } = data;

    if(used_strategy.exchange === "kucoin"){
        const API = kucoin({
            symbol: used_strategy.market_id.toUpperCase(), 
            api_key: used_strategy.api_key, 
            secret_key: used_strategy.secret_key, 
            passphrase: used_strategy.passphrase
        });
        if(actions === "open") {
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

        if(actions === "close") {
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
    };

    return false
}


const robot = async () => {
        
    // const trades = await Bots.find();

    // if(!trades || !trades.length) return console.log(`No trades`);

    // console.log(`-----------------------------------------------`);
    // console.log(`Testing`);

    // for(let x of trades){

    //     const {used_strategy} = x;

    //     const exchange_price = await exchange_market_price(x);
    //     if(!exchange_price) return;
    //     const {price} = exchange_price;

    //     const KucoinLive = kucoin({
    //         symbol: used_strategy.market_id.toUpperCase(), 
    //         api_key: used_strategy.api_key, 
    //         secret_key: used_strategy.secret_key, 
    //         passphrase: used_strategy.passphrase
    //     });

    //     const open = await KucoinLive.placePosition({
    //        price: price,
    //        side: "buy",
    //        size: 20,
    //        leverage: 2 
    //     });
    //     console.log(open)
    //     if(!open) return;
    //     const position = await KucoinLive.getPosition(open.orderId);
    //     console.log(position);
        

    //     const close = await KucoinLive.closePosition('641de1e966e44000017886bd');
    //     const position = await KucoinLive.getPosition(close.orderId);
    //     console.log(position);

        
    // };

}

export default robot