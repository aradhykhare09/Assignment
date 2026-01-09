import { Controller, Post, Param } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) { }

  @Post('categories')
  async scrapeCategories() {
    return this.scrapingService.scrapeCategories();
  }

  @Post('products/:slug')
  async scrapeProducts(@Param('slug') slug: string) {
    return this.scrapingService.scrapeProducts(slug);
  }
}
