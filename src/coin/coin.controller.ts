import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CoinService } from './coin.service';
import { CoinRo } from './dto/coin.ro';

@ApiTags('Coin')
@Controller('coin')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Get last saved coin price (public, no auth required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest coin price',
    type: CoinRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No coin price records found',
  })
  async getLatestGoldPricePublic() {
    const goldPrice = await this.coinService.getCoinFromDB();
    if (!goldPrice) {
      throw new NotFoundException('No coin price records found');
    }
    return goldPrice;
  }

  @Get('coin/panel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coin prices' })
  @ApiResponse({
    status: 200,
    type: CoinRo,
  })
  async getGoldPanel(): Promise<CoinRo> {
    return this.coinService.getAllCoinPrices();
  }
}
