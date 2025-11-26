import { BadRequestException, Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login.user.dto";
import { ConfigService } from "@nestjs/config";
import { User } from "./entities/user.entity";
import { AuthToken } from "./entities/authToken.entity";
//import { Role } from "./entities/enums";
import { Organization } from "../organization/entities/organization.entity";
import { OrganizationUser } from "../organization/entities/organization_user.entity";
import { Role } from "../organization/entities/enums";

@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private readonly organizationUserRepository: Repository<OrganizationUser>,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  // ====================
  // Registro de usuario
  // Este método solo registra al usuario sin asignarlo a ninguna organización.
  // La asignación a una organización se manejará por separado por el OrganizationService.
  // ====================
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const { email, password } = registerUserDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      email,
      password_hash: hashedPassword,
      is_active: true,
      name: email.split('@')[0],
    });
    await this.usersRepository.save(newUser);
    return newUser;
  }

  // ====================
  // Generar Access Token para un usuario
  // ====================
  // ====================
  // Generar Access Token para un usuario con todas sus organizaciones
  // ====================
  async generateAccessTokenForUser(user: User): Promise<string> {
    const userOrganizations = await this.organizationUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });

    const organizationsPayload = userOrganizations.map(ou => ({
      id: ou.organization.id,
      name: ou.organization.name,
      role: ou.role,
    }));

    const payload = {
      sub: user.id,
      email: user.email,
      organizations: organizationsPayload,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
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

    // Obtener todas las organizaciones del usuario
    const userOrganizations = await this.organizationUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });

    const organizationsPayload = userOrganizations.map(ou => ({
      id: ou.organization.id,
      name: ou.organization.name,
      role: ou.role,
    }));

    await this.authTokenRepository.update(
      { user: { id: user.id }, revoked: false },
      { revoked: true },
    );
    await this.authTokenRepository.delete({
      user: { id: user.id },
      expires_at: LessThan(new Date()),
    });

    const payload = { sub: user.id, email: user.email, organizations: organizationsPayload };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
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
      profile: user.profile,
      accessToken,
      refreshToken,
      estado: user.is_active ? 'activo' : 'pendiente',
      createdAt: user.created_at,
      organizations: organizationsPayload,
    };
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // ====================
  // Refresh token
  // ====================
  async refresh(user: any) {
    this.logger.debug(`Iniciando refresh para el usuario: ${user.id}`);

    const tokenInDb = user.authToken;
    if (!tokenInDb) {
      throw new UnauthorizedException('Token de refresco no validado por la estrategia.');
    }

    tokenInDb.revoked = true;
    await this.authTokenRepository.save(tokenInDb);

    // Obtener todas las organizaciones del usuario para el refresh token
    const userOrganizations = await this.organizationUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });

    const organizationsPayload = userOrganizations.map(ou => ({
      id: ou.organization.id,
      name: ou.organization.name,
      role: ou.role,
    }));

    const payload = { sub: user.id, email: user.email, organizations: organizationsPayload };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const newHash = await bcrypt.hash(newRefreshToken, 10);

    const newTokenEntity = this.authTokenRepository.create({
      refresh_token_hash: newHash,
      user: user,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.authTokenRepository.save(newTokenEntity);

    return {
      id: user.id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      estado: user.is_active ? 'activo' : 'pendiente',
      createdAt: user.created_at,
      organizations: organizationsPayload,
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
