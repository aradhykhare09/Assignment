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
    // Match by BOTH sourceUrl AND categorySlug
    // This allows same book to exist in multiple categories
    return this.productModel.findOneAndUpdate(
      {
        sourceUrl: createProductDto.sourceUrl,
        categorySlug: createProductDto.categorySlug
      },
      createProductDto,
      { upsert: true, new: true }
    ).exec();
  }

  async findAll(categorySlug?: string, search?: string, page: number = 1, limit: number = 50): Promise<{ products: Product[], total: number, page: number, totalPages: number }> {
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

    const skip = (page - 1) * limit;
    const total = await this.productModel.countDocuments(filter).exec();
    const products = await this.productModel.find(filter).skip(skip).limit(limit).exec();

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
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
