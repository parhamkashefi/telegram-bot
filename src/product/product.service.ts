import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product, ProductDocument } from './schema/product.schema';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { ProductRo } from './dto/product.ro';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductRo> {
    const product = await this.productModel.insertOne(createProductDto);
    return await plainToInstance(ProductRo, product, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(): Promise<ProductRo[]> {
    const products = await this.productModel.find().sort({ createdAt: -1 }).exec();
    return plainToInstance(ProductRo, products, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductRo> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      { new: true },
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return plainToInstance(ProductRo, updatedProduct, {
      excludeExtraneousValues: true,
    });
  }
}
