import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login.user.dto';
import type { RequestWithUser } from '../common/interfaces/RequestWithUser';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { JwtRefreshGuard } from 'src/jwt/jwt.guard';
import type { Response } from 'express';
import ConfigEnvs from 'src/config/envs';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Email ya registrado o datos inválidos.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de un usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Usuario logueado exitosamente.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Email o contraseña incorrectos.' })
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, ...user } = await this.authService.login(loginUserDto);

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: ConfigEnvs.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, user };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout de un usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Usuario deslogueado exitosamente.' })
  async logout(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user);
    res.clearCookie('refresh-token');
    return { message: 'Logout exitoso' };
  }

  
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualización de token de acceso' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token actualizado exitosamente.' })
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, ...user } = await this.authService.refresh(req.user);

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: ConfigEnvs.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    });

    return { accessToken, user };
  }
}
