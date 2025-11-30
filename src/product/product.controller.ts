import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ProductRo } from './dto/product.ro';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // 🔐 Create product
  @ApiOperation({ summary: 'Create new product.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, type: ProductRo })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductRo> {
    return this.productService.create(createProductDto) ;
  }

  // 🔓 Public list
  @ApiOperation({ summary: 'Get all products.' })
  @ApiResponse({ status: 200, type: [ProductRo] })
  @Get()
  async findAll(): Promise<ProductRo[]> {
    return this.productService.findAll() ;
  }

  // 🔐 Update product
  @ApiOperation({ summary: 'Update product by ID.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: ProductRo })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductRo> {
    return this.productService.update(id, dto) as any;
  }
}
