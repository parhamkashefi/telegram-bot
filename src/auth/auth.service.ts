import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { LoginRO } from './dto/login.ro';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginRO> {
    // Validate admin credentials
    const isValid = this.validateAdmin(dto.username, dto.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generate JWT token
    const access_token = this.generateToken(dto.username);

    return { access_token };
  }

  private validateAdmin(username: string, password: string): boolean {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    
    return (
      username === adminUsername &&
      password === adminPassword
    );
  }

  private generateToken(username: string): string {
    const payload = { username };
    return this.jwtService.sign(payload);
  }
}