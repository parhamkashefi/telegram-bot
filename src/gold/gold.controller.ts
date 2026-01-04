import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GoldService } from '../gold/gold.service';
import { GoldRo } from './dto/gold.ro';

@ApiTags('Gold')
@Controller('gold')
export class GoldController {
  constructor(private readonly goldService: GoldService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get last saved gold price (public, no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest gold price',
    type: GoldRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No gold price records found',
  })
  async getLatestGoldPricePublic() {
    const goldPrice = await this.goldService.getNewestGoldFromDB();
    if (!goldPrice) {
      throw new NotFoundException('No gold price records found');
    }
    return goldPrice;
  }

  @Get('gold/panel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gold bubble, global price and Iran average' })
  @ApiResponse({
    status: 200,
    type: GoldRo,
  })
  async getGoldPanel(): Promise<GoldRo> {
    return this.goldService.getAllGoldPrices();
  }
}
