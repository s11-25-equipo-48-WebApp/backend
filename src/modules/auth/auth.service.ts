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
import { Organization } from "../organization/entities/organization.entity";
import { OrganizationUser } from "../organization/entities/organization_user.entity";
import { UserProfile } from "./entities/userProfile.entity";

@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
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
    const { email, password, fullName } = registerUserDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Separar nombre y apellido
    let firstName = '';
    let lastName = '';
    if (fullName) {
      const [f, ...l] = fullName.trim().split(' ');
      firstName = f;
      lastName = l.join(' ');
    }

    // Crear usuario
    const newUser = this.usersRepository.create({
      name: firstName,
      last_name: lastName,
      email,
      password_hash: hashedPassword,
      is_active: true,
    });

    // Guardar primero el usuario
    await this.usersRepository.save(newUser);

    // Crear perfil asociado
    const profile = this.userProfileRepository.create({
      user: newUser,
      avatar_url: 'https://raw.githubusercontent.com/s11-25-equipo-48-WebApp/backend/refs/heads/main/src/public/static/avatar.png',
      bio: '',
      metadata: {},
    });

    // Guardar perfil
    await this.userProfileRepository.save(profile);

    // Asignar perfil al usuario (opcional)
    newUser.profile = profile;

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
      expiresIn: '1d',
    });
  }

  // ====================
  // Login
  // ====================
  // dentro de AuthService

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Buscar usuario por email
    const user = await this.usersRepository.findOne({ where: { email } });
    Logger.log('USER FROM DB =>', user);

    if (!user) {
      throw new UnauthorizedException('Email no Existe');
    }

    // Validar contraseña
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Organización del usuario
    const userOrganizations = await this.organizationUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });

    const organizationsPayload = userOrganizations.map((ou) => ({
      id: ou.organization.id,
      name: ou.organization.name,
      role: ou.role,
    }));

    // Revocar tokens previos
    await this.authTokenRepository.update(
      { user: { id: user.id }, revoked: false },
      { revoked: true },
    );

    // Eliminar tokens expirados
    await this.authTokenRepository.delete({
      user: { id: user.id },
      expires_at: LessThan(new Date()),
    });

    // Crear registro temporal del refresh token
    const tokenRecord = await this.authTokenRepository.save(
      this.authTokenRepository.create({
        refresh_token_hash: '',
        user_id: user.id,
        expires_at:new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
      }),
    );

    // Payloads
    const accessPayload = {
      sub: user.id,
      email: user.email,
      organizations: organizationsPayload,
    };

    const refreshPayload = {
      ...accessPayload,
      tokenId: tokenRecord.id,
    };

    // Firmar tokens
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '1d',
    });

    // Guardar hash del refresh token
    tokenRecord.refresh_token_hash = await bcrypt.hash(refreshToken, 10);
    await this.authTokenRepository.save(tokenRecord);

    // Respuesta final
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

    // Revocar específicamente el token validado por la estrategia
    const currentToken: AuthToken | undefined = user.authToken;
    if (!currentToken) {
      // Si la estrategia no adjuntó el token, no continuamos
      throw new UnauthorizedException('Token de refresco no validado por la estrategia.');
    }

    // Revocar el token usado para este refresh y persistirlo
    currentToken.revoked = true;
    await this.authTokenRepository.save(currentToken);

    // Obtener organizaciones
    const userOrganizations = await this.organizationUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['organization'],
    });

    const organizationsPayload = userOrganizations.map(ou => ({
      id: ou.organization.id,
      name: ou.organization.name,
      role: ou.role,
    }));

    const accessPayload = {
      sub: user.id,
      email: user.email,
      organizations: organizationsPayload,
    };

    const newAccessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    // Crear el registro del token primero para obtener el ID
    const newTokenEntity = this.authTokenRepository.create({
      refresh_token_hash: '',
      user_id: user.id,
      expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
    });

    await this.authTokenRepository.save(newTokenEntity);

    // Ahora incluir el tokenId en el payload del refresh token
    const refreshPayload = {
      ...accessPayload,
      tokenId: newTokenEntity.id,
    };

    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '1d',
    });

    // Actualizar el hash del refresh token
    const newHash = await bcrypt.hash(newRefreshToken, 10);
    newTokenEntity.refresh_token_hash = newHash;
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
