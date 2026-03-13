import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { IsString, Length } from 'class-validator';

class SendOtpDto {
  @IsString()
  phone: string;
}

class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  @Length(5, 5)
  code: string;

  @IsString()
  deviceName?: string;

  @IsString()
  platform?: string;

  @IsString()
  browser?: string;
}

class RefreshDto {
  @IsString()
  refreshToken: string;
}

class LogoutDto {
  @IsString()
  refreshToken?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto, @Request() req: any) {
    return this.authService.verifyOtp(dto.phone, dto.code, {
      deviceName: dto.deviceName,
      platform: dto.platform,
      browser: dto.browser,
      ip: req.ip,
    });
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@Request() req: any, @Body() dto: LogoutDto) {
    return this.authService.logout(req.user.userId, dto.refreshToken);
  }
}
