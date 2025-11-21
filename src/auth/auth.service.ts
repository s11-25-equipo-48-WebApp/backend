import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { User } from "../common/entities/user.entity";
import { AuthToken } from "../common/entities/authToken.entity";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login.user.dto";
import ConfigEnvs from "../config/envs";
import { Role } from "../common/entities/enums";
import { Logger } from "@nestjs/common";
import { profile } from "console";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    private readonly jwtService: JwtService,
  ) {
    this.logger = new Logger(AuthService.name);
  }
  private readonly logger: Logger;

  // ====================
  // Registro de usuario
  // ====================
  async register(registerUserDto: RegisterUserDto) {
    const { email, password } = registerUserDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) throw new BadRequestException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      email,
      password_hash: hashedPassword,
      is_active: true,
      role: Role.ADMIN,
      name: email.split('@')[0],
    });
    await this.usersRepository.save(newUser);

    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: ConfigEnvs.JWT_SECRET,
      expiresIn: '15m',
    });

    return {
      id: newUser.id,
      accessToken,
      estado: newUser.is_active ? 'activo' : 'pendiente',
      createdAt: newUser.created_at,
    };
  }

  // ====================
  // Login
  // ====================
  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Email o contraseña incorrectos');

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) throw new BadRequestException('Email o contraseña incorrectos');

    // LIMPIAR refresh tokens expirados ANTES DE GENERAR NUEVOS

    await this.authTokenRepository.update(
      { user: { id: user.id }, revoked: false },
      { revoked: true },
    );
    await this.authTokenRepository.delete({
      user: { id: user.id },
      expires_at: LessThan(new Date()),
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: ConfigEnvs.JWT_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: ConfigEnvs.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const tokenEntity = this.authTokenRepository.create({
      refresh_token_hash: refreshTokenHash,
      user: user,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.authTokenRepository.save(tokenEntity);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      accessToken,
      refreshToken,
      estado: user.is_active ? 'activo' : 'pendiente',
      createdAt: user.created_at,
    };
  }

  // ====================
  // Refresh token
  // ====================
  async refresh(user: any) {
    this.logger.debug(`Iniciando refresh para el usuario: ${user.id}`);
    const tokenInDb = user.authToken;

    if (!tokenInDb) {
      this.logger.error(`authToken no encontrado en el objeto de usuario para: ${user.id}. Esto no debería ocurrir si la estrategia funciona correctamente.`);
      throw new UnauthorizedException('Token de refresco no validado por la estrategia.');
    }

    tokenInDb.revoked = true;
    await this.authTokenRepository.save(tokenInDb);
    this.logger.debug(`Token de refresco antiguo revocado para el usuario: ${user.id}`);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: ConfigEnvs.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    const newHash = await bcrypt.hash(newRefreshToken, 10);

    const newTokenEntity = this.authTokenRepository.create({
      refresh_token_hash: newHash,
      user: user,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.authTokenRepository.save(newTokenEntity);
    this.logger.debug(`Nuevo token de refresco generado y guardado para el usuario: ${user.id}`);

    return {
      id: user.id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      estado: user.is_active ? 'activo' : 'pendiente',
      createdAt: user.created_at,
    };
  }

  // ====================
  // Logout
  // ====================
  async logout(user: any) {
    await this.authTokenRepository.update({ user: { id: user.id } }, { revoked: true });
    return {
      id: user.id,
      estado: user.is_active ? 'activo' : 'pendiente',
      createdAt: user.created_at,
    };
  }
}
