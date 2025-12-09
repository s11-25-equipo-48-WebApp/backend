import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, UseGuards, Logger, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import type { LoginUserDto } from './dto/login.user.dto';
import type { RequestWithUser } from '../../common/interfaces/RequestWithUser';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { JwtRefreshGuard } from 'src/jwt/jwt.guard';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenInterceptor } from 'src/common/interceptors/refresh-token.interceptor';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(RefreshTokenInterceptor)
  async login(@Body() loginUserDto: LoginUserDto) {
    Logger.log(`Data${loginUserDto}`);
    return await this.authService.login(loginUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user);
    res.clearCookie('refresh-token');
    return { message: 'Logout exitoso' };
  }

  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(RefreshTokenInterceptor)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req) {
    return await this.authService.refresh(req.user);
  }
}
