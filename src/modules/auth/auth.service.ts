
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotAcceptableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';
import { UsersService } from '../users_root/users/users.service';
import { OtpService } from './otp.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot.password';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) { }


  //** Generate Access + Refresh tokens
  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone
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
  async validateUserByEmailAndPassword(dto:LoginDto) {
    const user = await this.usersService.findByEmailOrPhone(dto.email,dto.phone);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password as string);
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
      const message = err instanceof Error ? err.message : 'Invalid or expired refresh token';
      // console.log(err);
      throw new ForbiddenException(message);
    }
  }

  //user logout
  async logout(userId: number) {
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        refresh_token: null
      }
    })
  }


  // forgot password
  async forgotPassword( dto: ForgotPasswordDto) {
        const user = await this.usersService.findByEmailOrPhone(dto.email,dto.phone); 
        console.log(user);
        if(!user){
            throw new BadRequestException("User not found with provided email or phone")
        }
        if(!user.is_verified){
            throw new BadRequestException("User not verified")
        }
    const otp = await this.otpService.generateOtp(dto.email, dto.phone);
    // TODO:currently by email it will be in phone
 
    return { email: dto.email, phone: dto.phone, message: "OTP sent", otp};
  }

  
  // verify otp
  async verifyOtpForForgetPass(email: string | undefined, phone: string | undefined, otp: string){
      const isOtpVerified = await this.otpService.verifyOtp(email, phone, otp);
      // 
      if(isOtpVerified){
          // build conditions only for provided identifiers
          const conditions: any[] = [];
          if (email) conditions.push({ email });
          if (phone) conditions.push({ phone });

          if (conditions.length > 0) {
            // updateMany accepts a non-unique where (UserWhereInput) with OR
            await this.prisma.user.updateMany({
              where: {
                OR: conditions,
              },
              data: {
                reset_pass: true,
              },
            });
          }
      } 
  }


  // reset password
  async resetPassword(email: string,phone:string, newPassword: string) {
    // 

    // 
  const user = await this.prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });
  if (!user) throw new BadRequestException('Invalid email');

   if(user.reset_pass === false){
       throw new NotAcceptableException("Please verify your account through Otp")
   }
  //  
  const hashed = await bcrypt.hash(newPassword, 10);
  const record = await bcrypt.compare(newPassword, user.password as string);
  if (record) throw new NotAcceptableException('Password is correct you can login'); 
        // 
        await this.prisma.user.updateMany({
        where: {
          OR: [{email},{phone}],
        },
        data: {
          password:hashed,
          reset_pass: true,
        },
      });
  return { message: 'Password reset successful' };
}

}
