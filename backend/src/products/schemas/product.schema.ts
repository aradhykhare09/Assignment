import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    title: string;

    @Prop()
    author: string;

    @Prop()
    price: string;

    @Prop()
    currency: string;

    @Prop()
    imageUrl: string;

    @Prop({ required: true, unique: true })
    sourceUrl: string;

    @Prop({ unique: true })
    sourceId: string;

    @Prop()
    description: string;

    @Prop({ type: Object })
    specs: Record<string, any>;

    @Prop()
    rating: number;

    @Prop()
    reviewsCount: number;

    @Prop()
    lastScrapedAt: Date;

    @Prop({ index: true })
    categorySlug: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
