import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto/login.dto';
import { LoginRO } from '../auth/dto/login.ro';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login to get JWT token' })
  @ApiResponse({ status: 200, type: LoginRO })
  async login(@Body() dto: LoginDto): Promise<LoginRO> {
    return this.authService.login(dto);
  }
}
