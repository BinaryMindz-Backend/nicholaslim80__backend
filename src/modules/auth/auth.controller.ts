/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { Auth } from './auth.decorator';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

 
  //** Signup + Send OTP
  @Post('signup')
  @ApiOperation({ summary: 'Create new user & send OTP to email or phone' })
  @ApiBody({type:CreateUserDto})
  @ApiResponse({ status: 201, description: 'User created & OTP sent' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async signup(
    @Body() dto: CreateUserDto,
  ) {
     await this.usersService.createUser(dto);
    return { message: 'User created. OTP sent for verification.' };
  }


  //** Verify Signup OTP
  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP sent during signup' })
  @ApiBody({type:VerifyOtpDto})
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verify(@Body() dto: { email?: string , phone?:string; otp: string }) {
    const { email, phone, otp } = dto;
    await this.otpService.verifyOtp(email, phone, otp);
    return { message: 'Verified successfully' };
  }


  //** Login Request OTP //login by otp
  @Post('login/request-otp')
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiBody({
    type:RequestOtpDto
  })
  @ApiResponse({ status: 200, description: 'OTP sent for login' })
  @ApiResponse({ status: 404, description: 'User not found / not verified' })
  async requestLoginOtp(@Body() dto: { email: string, phone:string }) {
    const user = await this.usersService.findByEmailOrPhone(dto.email, dto.phone);
    if (!user) throw new BadRequestException('User not found');
    if (!user.is_verified) throw new BadRequestException('User not verified');

    await this.otpService.generateOtp(dto.email, dto.phone);
    return { message: 'OTP sent for login' };
  }

  
  //** */ Verify Login OTP → returns Access + Refresh Tokens
  @Post('login/verify-otp')
  @ApiOperation({ summary: 'Verify login OTP & return JWT tokens' })
  @ApiBody({type:VerifyOtpDto
  })
  @ApiResponse({ status: 200, description: 'Login successful; tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async loginVerify(@Body() dto: { email?: string; phone?:string; otp: string }) {
    const { email, phone,otp } = dto;
    // send to verify otp
    await this.otpService.verifyOtpForLoginAndClear(email, phone, otp);

    const user = await this.usersService.findByEmailOrPhone(email, phone);
    // for generate token
    return this.authService.loginWithOtp(user);
  }

  
  // ** Traditional login using password
  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiBody({type:LoginDto})
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: { email: string; password: string }) {
    const user = await this.authService.validateUserByEmailAndPassword(
      dto.email,
      dto.password,
    );
    return this.authService.loginWithCredentials(user);
  }

 
  //** REFRESH TOKEN endpoint for new token generation
@Post('refresh')
@ApiOperation({ summary: 'Refresh access token using refresh token' })
@ApiBody({
  schema: { properties: { refresh_token: { type: 'string' } } },
})
@ApiResponse({ status: 200, description: 'New tokens generated' })
@ApiResponse({ status: 401, description: 'Invalid refresh token' })
async refresh(@Body() body: { refresh_token: string }) {
  const { refresh_token } = body;
  return this.authService.refreshTokens(refresh_token);
}

// ** logout
@Post('logout')
@ApiOperation({ summary: 'Logout user' })
@Auth()
@ApiBearerAuth()
async logout(@Req() req) {
  // console.log(req.user);
  await this.authService.logout(+req.user.id);
  return { message: 'Logged out successfully' };
}


}
