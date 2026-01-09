export class CreateCategoryDto {
    title: string;
    slug: string;
    url: string;
    parentId?: string;
    lastScrapedAt?: Date;
}
