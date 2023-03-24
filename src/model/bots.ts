import { Schema, model, PopulatedDoc, Types, Document } from 'mongoose';
import { IStrategies } from './strategies';
import { IOrders } from './orders';

export interface IBotOrder {
    orderId: string
    market_id: string,
    side: "buy" | "sell",
    moving_price: number,
    open_price: number,
    stop_loss: number,
    take_profit: number,
    createdAt: Date,
}

export interface IBots extends Partial<Document> {
    user: PopulatedDoc<Types.ObjectId>,
    strategy: PopulatedDoc<Types.ObjectId>,
    used_strategy: IStrategies,
    order: IBotOrder,
    price_snapshot: number,
    price_open_snapshot: number,
    market_id: string,
    stop: boolean,
    orders: IOrders[],
    createdAt: Date,
}

const BotSchema = new Schema<IBots>({
    user: {
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    strategy: {
        type: Schema.Types.ObjectId,
        ref: "strategies"
    },
    price_snapshot: {
        type: Number,
    },
    price_open_snapshot: {
        type: Number
    },
    market_id: {
        type: String
    },
    stop: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: new Date
    },
    used_strategy: {
        live: Boolean,
        exchange: String,
        market_id: String,
        strategy: String,
        short: Number,
        long: Number,
        stop_loss: Number,
        trailing_take_profit: Boolean,
        position_size: Number,
        usdt_balance: Number,
        leverage: Number,
        take_profit: Number,
        max_orders: Number,
        reset: Number,
        api_key: String,
        secret_key: String,
        passphrase: String,
    },
    order: {
        orderId: String,
        moving_price: Number,
        open_price: Number,
        stop_loss: Number,
        take_profit: Number,
        createdAt: Date,
        market_id: {
            type: String,
            uppercase: true,
        },
        side: {
            type: String,
            enum: ["buy", "sell"]
        },
    },
    orders: [

    ],
});

export default model<IBots>('Bots', BotSchema);