import { Controller, Post } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) { }

  @Post('categories')
  async scrapeCategories() {
    return this.scrapingService.scrapeCategories();
  }
}
