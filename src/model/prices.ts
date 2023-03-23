import {Types, Schema, model, Document} from 'mongoose';

export interface IPrices extends Document {
    bots: Types.ObjectId,
    price: number,
    createdAt: Date,
};

const PricesSchema = new Schema<IPrices>({
    bots: {
        type: Schema.Types.ObjectId,
        ref: 'Bots'
    },
    price: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: new Date
    },
});

export default model<IPrices>('Prices', PricesSchema);
