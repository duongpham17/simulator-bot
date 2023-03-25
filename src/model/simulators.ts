import { Types, Schema, model, Document } from 'mongoose';
import { IStrategiesUsed } from './strategies';
import { IOrders } from './orders';

export interface ISimulators extends Partial<Document> {
    user: Types.ObjectId,
    bots: Types.ObjectId,
    strategy: Types.ObjectId,
    used_strategy: IStrategiesUsed,
    orders: IOrders[] | null, 
    prices_count: number,
    market_id: string,
    live: boolean,
    synced: boolean,
    message: "error" | "success",
    createdAt: Date,
    closedAt: Date,
};

const SimulatorsSchema = new Schema<ISimulators>({
    user: {
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    bots: {
        type: Schema.Types.ObjectId, 
        ref: 'Bots' 
    },
    strategy: {
        type: Schema.Types.ObjectId,
        ref: 'Strategies'
    },
    prices_count: {
        type: Number,
        default: 0
    },
    live: {
        type: Boolean,
    },
    market_id: {
        type: String,
        uppercase: true,
    },
    synced: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: new Date
    },
    closedAt: {
        type: Date,
        default: new Date
    },
    message: {
        type: String,
        enum: ["error", "success"]
    },
    orders: [

    ],
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
    },
});

export default model<ISimulators>('Simulators', SimulatorsSchema);
