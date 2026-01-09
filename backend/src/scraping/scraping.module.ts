import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { CategoriesModule } from '../categories/categories.module';

import { ProductsModule } from '../products/products.module';

@Module({
  imports: [CategoriesModule, ProductsModule],
  controllers: [ScrapingController],
  providers: [ScrapingService],
})
export class ScrapingModule { }
