import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private adminUser = {
    username: 'parham',
    password: 'parham',
  };

  constructor(private readonly jwtService: JwtService) {}

  validateAdmin(username: string, password: string): boolean {
    return (
      username === this.adminUser.username &&
      password === this.adminUser.password
    );
  }

  login(username: string) {
    const payload = { username };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
