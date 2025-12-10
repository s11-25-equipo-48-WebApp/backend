import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login.user.dto';
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
  ) {}

  // ------------------------------------
  // REGISTER
  // ------------------------------------
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el usuario ya existe',
  })
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  // ------------------------------------
  // LOGIN
  // ------------------------------------
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas',
  })
  @Post('login')
  @UseInterceptors(RefreshTokenInterceptor)
  async login(@Body() loginUserDto: LoginUserDto) {
    Logger.log(`Data${loginUserDto}`);
    return await this.authService.login(loginUserDto);
  }

  // ------------------------------------
  // LOGOUT
  // ------------------------------------
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user);
    res.clearCookie('refresh-token');
    return { message: 'Logout exitoso' };
  }

  // ------------------------------------
  // REFRESH TOKEN
  // ------------------------------------
  @ApiOperation({ summary: 'Generar nuevos tokens usando el refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(RefreshTokenInterceptor)
  @Post('refresh')
  async refresh(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, ...user } =
      await this.authService.refresh(req.user);

    return { accessToken, user };
  }
}
