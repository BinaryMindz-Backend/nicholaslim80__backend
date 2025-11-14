/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}


  //** Generate Access + Refresh tokens
  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      phone:user.phone
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d', // 1 day
    });

    const refresh_token = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '7d' }, // 7 days
    );

    return {
      access_token,
      refresh_token,
      expires_in: 3600,
    };
  }

  // Hash refresh token before saving to DB
  async updateRefreshToken(userId: number, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.usersService.updateUserRefreshToken(userId, hashed);
  }

  async removeRefreshToken(userId: number) {
    await this.usersService.updateUserRefreshToken(userId, null);
  }


  // Login using OTP
  async loginWithOtp(user: any) {
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }


  // Login using Email + Password (optional)
  async loginWithCredentials(user: any) {
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }



  // Validate email/password
  async validateUserByEmailAndPassword(email: string, password: string) {
    const user = await this.usersService.findByEmailOrPhone(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password as string);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  
  // Refresh access token using refresh token
async refreshTokens(refreshToken: string) {
  try {
    // Verify and decode refresh token
    const payload = await this.jwtService.verifyAsync(refreshToken);
    const userId = payload.sub;

    if (!userId) throw new ForbiddenException("Invalid token payload");

    //Fetch user
    const user = await this.usersService.findOneuser(userId);
    if (!user || !user.refresh_token)
      throw new ForbiddenException('Access Denied');

    // Compare provided token with stored hashed token
    const isValid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!isValid) throw new ForbiddenException('Invalid refresh token');

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Save new refresh token
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  } catch (err) {
    throw new ForbiddenException("Invalid or expired refresh token");
  }
}

}
