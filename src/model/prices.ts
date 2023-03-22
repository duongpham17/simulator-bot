import {Types, Schema, model, Document} from 'mongoose';

export interface IPrices extends Document {
    simulator: Types.ObjectId,
    price: number,
    createdAt: Date,
};

const PricesSchema = new Schema<IPrices>({
    simulator: {
        type: Schema.Types.ObjectId,
        ref: 'Simulators'
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
