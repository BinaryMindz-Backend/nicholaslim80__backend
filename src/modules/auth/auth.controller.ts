import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { CreateUserDto } from '../users_root/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { Auth } from '../../decorators/auth.decorator';
import { UsersService } from '../users_root/users/users.service';
import { UploadImageDto } from './dto/uploadImage.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storageConfig } from 'src/common/fileUpload/file';
import { ApiResponses } from 'src/common/apiResponse';
import { ForgotPasswordDto } from './dto/forgot.password';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from 'src/decorators/public.decorator';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) { }


  //** Signup + Send OTP
  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Create new user & send OTP to email or phone' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created & OTP sent' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async signup(
    @Body() dto: CreateUserDto,
  ) {
    const res = await this.usersService.createUser(dto as any);
    return { message: 'User created. OTP sent for verification.', res };
  }


  //** Verify Signup OTP
  @Post('verify')
  @Public()
  @ApiOperation({ summary: 'Verify OTP sent during signup' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verify(@Body() dto: { email?: string, phone?: string; otp: string }) {
    const { email, phone, otp } = dto;
    await this.otpService.verifyOtp(email, phone, otp);

    const user = await this.usersService.findByEmailOrPhone(email, phone);
    // for generate token
    return this.authService.loginWithOtp(user);
  }


  //** Login Request OTP //login by otp
  @Post('login/request-otp')
  @Public()
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiBody({
    type: RequestOtpDto
  })
  @ApiResponse({ status: 200, description: 'OTP sent for login' })
  @ApiResponse({ status: 404, description: 'User not found / not verified' })
  async requestLoginOtp(@Body() dto: { email: string, phone: string }) {
    const user = await this.usersService.findByEmailOrPhone(dto.email, dto.phone);
    if (!user) throw new BadRequestException('User not found');
    if (!user.is_verified) throw new BadRequestException('User not verified');

    await this.otpService.generateOtp(dto.email, dto.phone);
    return { message: 'OTP sent for login' };
  }
  


  //** */ Verify Login OTP → returns Access + Refresh Tokens
  @Post('login/verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verify login OTP & return JWT tokens' })
  @ApiBody({
    type: VerifyOtpDto
  })
  @ApiResponse({ status: 200, description: 'Login successful; tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async loginVerify(@Body() dto: { email?: string, phone?: string, otp: string }) {
    const { email, phone, otp } = dto;
    // send to verify otp
    await this.otpService.verifyOtpForLoginAndClear(email, phone, otp);

    const user = await this.usersService.findByEmailOrPhone(email, phone);
    // for generate token
    return this.authService.loginWithOtp(user);
  }


  // ** Traditional login using password
  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email or phone & password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUserByEmailAndPassword(dto);
    return this.authService.loginWithCredentials(user);
  }


  //** REFRESH TOKEN endpoint for new token generation
  @Post('refresh')
  @Auth()
  @Public()
  @ApiBearerAuth()
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
  @Public()
  @ApiBearerAuth()
  async logout(@Req() req) {
    // console.log(req.user);
    await this.authService.logout(+req.user.id);
    return { message: 'Logged out successfully' };
  }



  // image upload for profile picture
  @ApiTags('File Upload')
  @Post('upload')
  @Public()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: storageConfig('./uploads'),
    }),
  )
  uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    if (!process.env.BASE_URL) {
      throw new BadRequestException('Base URL not configured');
    }
    const fileUrls = files.map((file) =>
      `${process.env.BASE_URL}/uploads/${file.filename}`
    );

    return ApiResponses.success(fileUrls, 'Files uploaded successfully');
  }


  
  // forgot password 
  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
     const res = await this.authService.forgotPassword( dto.email, dto.phone);
      return ApiResponses.success(res, 'otp send successfully');
    } catch (error) {
       return ApiResponses.error(error, "Forget Password failed")
    }
  }

  // 
  @Post('forgetpass/verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verify OTP for reset password' })
  @ApiBody({
    type: VerifyOtpDto
  })
  @ApiResponse({ status: 200, description: 'Otp verified' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async forgotPassVerify(@Body() dto: { email?: string, phone?: string, otp: string }) {
    const { email, phone, otp } = dto;
    // send to verify otp
    try {
      const res = await this.authService.verifyOtpForForgetPass(email, phone, otp);
      return ApiResponses.success(res,"otp verified successfully")
    } catch (error) {
        return ApiResponses.error(error,"otp verified error")
    }
  }


  // reset pass
  @Post('reset-password')
  @Public()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    //  
    try{
       const res = await this.authService.resetPassword(dto.email,dto.phone, dto.newPassword);
       return ApiResponses.success(res, 'Reset password successfully');
    }catch(err){
      console.log(err);
       return ApiResponses.success(err, 'Failed to forget password');
    }
  }

  // 
}
