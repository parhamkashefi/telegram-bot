import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  validateAdmin(username: string, password: string): boolean {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    
    return (
      username === adminUsername &&
      password === adminPassword
    );
  }

  login(username: string) {
    const payload = { username };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}