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
  // ====================
  async register(registerUserDto: RegisterUserDto, organizationId?: string, role?: Role) {
    const { email, password } = registerUserDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) throw new BadRequestException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      email,
      password_hash: hashedPassword,
      is_active: true,
      name: email.split('@')[0],
    });
    await this.usersRepository.save(newUser);

    //let assignedOrganizationId: string | null = null;

    let orgPayload: { id: string; role: Role } | null = null;

    if (organizationId) {
      const organization = await this.organizationRepository.findOneBy({ id: organizationId });
      if (!organization) throw new BadRequestException(`Organización con ID ${organizationId} no encontrada`);

      const organizationUser = this.organizationUserRepository.create({
        user: newUser,
        organization: organization,
        role: role || Role.EDITOR,
      });

      await this.organizationUserRepository.save(organizationUser);

      orgPayload = {
        id: organization.id,
        role: organizationUser.role,
      };
    }

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      organization: orgPayload,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    return {
      id: newUser.id,
      accessToken,
      estado: newUser.is_active ? 'activo' : 'pendiente',
      createdAt: newUser.created_at,
      organization: orgPayload,
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

    const loginOrgUserRelation = await this.organizationUserRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });

    const organizationId = loginOrgUserRelation?.organization?.id || null;
    const organizationName = loginOrgUserRelation?.organization?.name || null;

    await this.authTokenRepository.update(
      { user: { id: user.id }, revoked: false },
      { revoked: true },
    );
    await this.authTokenRepository.delete({
      user: { id: user.id },
      expires_at: LessThan(new Date()),
    });

    const organization = await this.organizationRepository.findOneBy({ members: { user: { id: user.id } } });
    const userRole = loginOrgUserRelation?.role || '';


    const payload = { sub: user.id, email: user.email, organization: organizationId ? { id: organizationId, name: organizationName, role: userRole } : null };

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
      organization: organizationId ? { id: organizationId, name: organizationName, role: userRole } : null,
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

    const refreshOrgUserRelation = await this.organizationUserRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });
    const organizationId = refreshOrgUserRelation?.organization?.id || null;
    const userRole = refreshOrgUserRelation?.role || '';
    const organizationName = refreshOrgUserRelation?.organization?.name || null;
    const organizationPayload = organizationId ? { id: organizationId, name: organizationName, role: userRole } : null;

    const payload = { sub: user.id, email: user.email, organization: organizationPayload };

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
      organization: organizationPayload,
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
