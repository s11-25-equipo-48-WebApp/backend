import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login.user.dto';
import type { RequestWithUser } from '../../common/interfaces/RequestWithUser';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { JwtRefreshGuard } from 'src/jwt/jwt.guard';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

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
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, ...user } = await this.authService.login(loginUserDto);

    const isProd = this.config.get('NODE_ENV') === 'production';

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProd,                     // https en prod
      sameSite: isProd ? 'none' : 'lax',  // none para frontend vercel
      path: '/api/v1/auth/refresh',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, user };
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
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, ...user } = await this.authService.refresh(req.user);

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, user };
  }
}