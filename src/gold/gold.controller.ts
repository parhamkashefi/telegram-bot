import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GoldService } from '../gold/gold.service';
import { GoldRo } from './dto/gold.ro';

@ApiTags('Gold')
@Controller('gold')
export class GoldController {
  constructor(private readonly goldService: GoldService) {}

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
