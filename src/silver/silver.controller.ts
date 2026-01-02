import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SilverService } from './silver.service';
import { SilverRo } from './dto/silver.ro';

@ApiTags('Silver')
@Controller('silver')
export class SilverController {
  constructor(private readonly silverService: SilverService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get last saved silver price (public, no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest silver price',
    type: SilverRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No silver price records found',
  })
  async getLatestSilverPricePublic() {
    const silverPrice = await this.silverService.getNewestSilverFromDB();
    if (!silverPrice) {
      throw new NotFoundException('No silver price records found');
    }
    return silverPrice;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get last saved silver price' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest silver price',
    type: SilverRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No silver price records found',
  })
  async getLatestSilverPrice() {
    return await this.silverService.getNewestSilverFromDB();
  }
}
