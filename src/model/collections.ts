import {Types, Schema, model, Document} from 'mongoose';

export interface ICollectionsPrice {
    price: number,
    createdAt: Date,
}

export interface ICollections extends Document {
    simulator: Types.ObjectId,
    prices: ICollectionsPrice[],
    createdAt: Date,
};

const CollectionsSchema = new Schema<ICollections>({
    simulator: {
        type: Schema.Types.ObjectId,
        ref: 'Simulators'
    },
    prices: [
        {
            price: Number,
            createdAt: Date
        }
    ],
    createdAt: {
        type: Date,
        default: new Date
    },
});

export default model<ICollections>('Collections', CollectionsSchema);
