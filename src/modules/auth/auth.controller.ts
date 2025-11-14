/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';


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
  @ApiOperation({ summary: 'Create new user & send OTP to email' })
  @ApiBody({type:CreateUserDto})
  @ApiResponse({ status: 201, description: 'User created & OTP sent' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async signup(
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.usersService.createUser(dto);
     console.log(user);
    return { message: 'User created. OTP sent for verification.' };
  }


  //** Verify Signup OTP
  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP sent during signup' })
  @ApiBody({
    schema: { properties: { email: { type: 'string' }, otp: { type: 'string' } } },
  })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verify(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    await this.otpService.verifyOtpForEmail(email, otp);
    return { message: 'Verified successfully' };
  }


  //** Login Request OTP
  @Post('login/request-otp')
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiBody({
    type:LoginDto
  })
  @ApiResponse({ status: 200, description: 'OTP sent for login' })
  @ApiResponse({ status: 404, description: 'User not found / not verified' })
  async requestLoginOtp(@Body() body: { email: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) throw new BadRequestException('User not found');
    if (!user.is_verified) throw new BadRequestException('User not verified');

    await this.otpService.generateOtpForEmail(body.email);
    return { message: 'OTP sent for login' };
  }

  
  // Verify Login OTP → returns Access + Refresh Tokens
  @Post('login/verify-otp')
  @ApiOperation({ summary: 'Verify login OTP & return JWT tokens' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        otp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful; tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async loginVerify(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;

    await this.otpService.verifyOtpForLoginAndClear(email, otp);

    const user = await this.usersService.findByEmail(email);

    return this.authService.loginWithOtp(user);
  }

  
  // ** Traditional login using password
  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUserByEmailAndPassword(
      body.email,
      body.password,
    );
    return this.authService.loginWithCredentials(user);
  }

 
  //** REFRESH TOKEN endpoint

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

}
