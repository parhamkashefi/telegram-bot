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
  @ApiOperation({
    summary: 'Get last saved silver ball price (public, no auth required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest silver ball price',
    type: SilverRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No silver ball price records found',
  })
  async getLatestSilverBallPricePublic() {
    const silverPrice = await this.silverService.getPreviousSilverBallFromDB();
    if (!silverPrice) {
      throw new NotFoundException('No silver ball price records found');
    }
    return silverPrice;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get latest silver ball price (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest silver ball price',
    type: SilverRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No silver ball price records found',
  })
  async getLatestSilverBallPrice() {
    return await this.silverService.getPreviousSilverBallFromDB();
  }

  @Get('public')
  @ApiOperation({
    summary: 'Get last saved silver bar price (public, no auth required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest silver bar price',
    type: SilverRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No silver bar price records found',
  })
  async getLatestSilverBarPricePublic() {
    const silverPrice = await this.silverService.getPreviousSilverBarFromDB();
    if (!silverPrice) {
      throw new NotFoundException('No silver bar price records found');
    }
    return silverPrice;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get latest silver bar price (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest silver bar price',
    type: SilverRo,
  })
  @ApiResponse({
    status: 404,
    description: 'No silver bar price records found',
  })
  async getLatestSilverBarPrice() {
    return await this.silverService.getPreviousSilverBarFromDB();
  }
}
