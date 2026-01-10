import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async upsert(createProductDto: CreateProductDto): Promise<Product | null> {
    return this.productModel.findOneAndUpdate(
      { sourceUrl: createProductDto.sourceUrl },
      createProductDto,
      { upsert: true, new: true }
    ).exec();
  }

  async findAll(categorySlug?: string, search?: string): Promise<Product[]> {
    const filter: any = {};
    if (categorySlug) {
      filter.categorySlug = categorySlug;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }
    console.log('Finding products with filter:', JSON.stringify(filter));
    const results = await this.productModel.find(filter).exec();
    console.log(`Found ${results.length} products`);
    return results;
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Product | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
