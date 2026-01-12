import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ScrapingModule } from './scraping/scraping.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = process.env.MONGO_URI || configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/product-explorer';
        console.log('🔗 Connecting to MongoDB:', uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
        return { uri };
      },
      inject: [ConfigService],
    }),
    ProductsModule,
    CategoriesModule,
    ScrapingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
