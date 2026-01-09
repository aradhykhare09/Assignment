export class CreateProductDto {
    title: string;
    author?: string;
    price: string;
    currency?: string;
    imageUrl?: string;
    sourceUrl: string;
    sourceId?: string;
    description?: string;
    specs?: Record<string, any>;
    rating?: number;
    reviewsCount?: number;
    lastScrapedAt?: Date;
    categorySlug?: string;
}
