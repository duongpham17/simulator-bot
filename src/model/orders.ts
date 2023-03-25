import { Types, Schema, model, Document } from 'mongoose';
import { IStrategies, IStrategiesUsed } from './strategies';

export interface IOrders extends Partial<Document> {
    user: Types.ObjectId,
    bots: Types.ObjectId,
    orderId: string,
    market_id: string,
    closed: "manual" | "bot",
    side: "buy" | "sell",
    open_price: number,
    close_price: number,
    moving_price: number,
    profit_loss: number,
    take_profit: number,
    stop_loss: number,
    closedAt: Date,
    createdAt: Date,
    live: boolean,
    used_strategy: IStrategiesUsed
}

const OrdersSchema = new Schema<IOrders>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    bots: {
        type: Schema.Types.ObjectId,
        ref: 'Bots'
    },
    orderId: {
        type: String
    },
    market_id: {
        type: String,
        uppercase: true,
    },
    closed: {
        type: String,
        enum: ["manual", "bot"]
    },
    side: {
        type: String,
        enum: ["buy", "sell"]
    },
    open_price: {
        type: Number
    },
    close_price: {
        type: Number,
        default: 0
    },
    moving_price: {
        type: Number
    },
    stop_loss:{
        type: Number,
    },
    take_profit: {
        type: Number
    },
    profit_loss: {
        type: Number,
        default: 0
    },
    closedAt: {
        type: Date,
        default: new Date
    },
    createdAt: {
        type: Date,
    },
    live: {
        type: Boolean,
    },
    used_strategy: {
        exchange: String,
        market_id: String,
        strategy: String,
        short: Number,
        long: Number,
        stop_loss: Number,
        position_size: Number,
        usdt_balance: Number,
        leverage: Number,
        take_profit: Number,
        max_orders: Number,
        reset: Number,
        trailing_take_profit: Boolean,
        live: Boolean,
    },
});

export default model<IOrders>('Orders', OrdersSchema);
