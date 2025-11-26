import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Organization } from "./entities/organization.entity";
import { OrganizationUser } from "./entities/organization_user.entity";
import { LessThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/modules/auth/entities/user.entity";
import { AddOrganizationMemberDto, UpdateOrganizationDto, UpdateOrganizationMemberRoleDto, CreateOrganizationDto } from "./dto/organization.dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthToken } from "../auth/entities/authToken.entity";
import { Role } from "src/modules/auth/entities/enums";
import * as bcrypt from "bcrypt";

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(User)
            private readonly usersRepository: Repository<User>,
            @InjectRepository(Organization)
            private readonly organizationRepository: Repository<Organization>,
            @InjectRepository(OrganizationUser)
            private readonly organizationUserRepository: Repository<OrganizationUser>,
            @InjectRepository(AuthToken)
            private readonly authTokenRepository: Repository<AuthToken>,
            private readonly jwtService: JwtService,
            private readonly configService: ConfigService,
        
    ) { }

    async getOrganizationDetails(organizationId: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
            relations: ['members', 'members.user'],
        });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }
        return organization;
    }

    async updateOrganization(organizationId: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
        const organization = await this.organizationRepository.findOneBy({ id: organizationId });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }
        organization.name = updateDto.name;
        return this.organizationRepository.save(organization);
    }

    async deleteOrganization(organizationId: string): Promise<void> {
        const result = await this.organizationRepository.delete(organizationId);
        if (result.affected === 0) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }
    }

    async addMember(organizationId: string, addMemberDto: AddOrganizationMemberDto): Promise<OrganizationUser> {
        const organization = await this.organizationRepository.findOneBy({ id: organizationId });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }

        const user = await this.usersRepository.findOneBy({ email: addMemberDto.email });
        if (!user) {
            throw new NotFoundException(`Usuario con email ${addMemberDto.email} no encontrado.`);
        }

        const existingMember = await this.organizationUserRepository.findOne({
            where: { organization: { id: organizationId }, user: { id: user.id } },
        });
        if (existingMember) {
            throw new BadRequestException('El usuario ya es miembro de esta organización.');
        }

        const newMember = this.organizationUserRepository.create({
            organization,
            user,
            role: addMemberDto.role,
        });
        return this.organizationUserRepository.save(newMember);
    }

    async removeMember(organizationId: string, userId: string): Promise<void> {
        const result = await this.organizationUserRepository.delete({
            organization: { id: organizationId },
            user: { id: userId },
        });
        if (result.affected === 0) {
            throw new NotFoundException(`Miembro con ID de usuario ${userId} no encontrado en la organización ${organizationId}.`);
        }
    }

    async updateMemberRole(
        organizationId: string,
        userId: string,
        updateRoleDto: UpdateOrganizationMemberRoleDto,
    ): Promise<OrganizationUser> {
        const member = await this.organizationUserRepository.findOne({
            where: { organization: { id: organizationId }, user: { id: userId } },
        });
        if (!member) {
            throw new NotFoundException(`Miembro con ID de usuario ${userId} no encontrado en la organización ${organizationId}.`);
        }
        member.role = updateRoleDto.role;
        return this.organizationUserRepository.save(member);
    }

    async getOrganizationMembers(organizationId: string): Promise<OrganizationUser[]> {
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
            relations: ['members', 'members.user'],
        });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }
        return organization.members;
    }

    async getOrganizationMemberDetails(organizationId: string, userId: string): Promise<OrganizationUser> {
        const member = await this.organizationUserRepository.findOne({
            where: { organization: { id: organizationId }, user: { id: userId } },
            relations: ['user', 'user.profile'],
        });

        if (!member) {
            throw new NotFoundException(`Miembro con ID de usuario ${userId} no encontrado en la organización ${organizationId}.`);
        }
        // La propiedad password_hash ya está excluida en la entidad User gracias a @Exclude()

        return member;
    }

    async createOrganizationAndAssignUser(
      userId: string,
      userRole: Role,
      createOrganizationDto: CreateOrganizationDto,
    ): Promise<{ organization: Organization; newAccessToken: string; newRefreshToken: string }> {
      const user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      // Verificar si el usuario ya tiene una organización asignada
      const existingOrgUser = await this.organizationUserRepository.findOne({
        where: { user: { id: userId } },
      });
      if (existingOrgUser) {
        throw new BadRequestException('El usuario ya pertenece a una organización.');
      }

      // Crear la nueva organización
      const organization = this.organizationRepository.create({
        name: createOrganizationDto.name,
      });
      await this.organizationRepository.save(organization);

      // Asignar el usuario a la nueva organización con rol ADMIN
      const organizationUser = this.organizationUserRepository.create({
        user: user,
        organization: organization,
        role: Role.ADMIN, // El usuario que crea la organización es un ADMIN por defecto
      });
      await this.organizationUserRepository.save(organizationUser);

      // Generar nuevos tokens con la nueva organizationId
      const payload = { sub: user.id, email: user.email, role: userRole, organizationId: organization.id };

      const newAccessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      });

      const newRefreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });

      // Revocar tokens anteriores del usuario
      await this.authTokenRepository.update(
        { user: { id: user.id }, revoked: false },
        { revoked: true },
      );
      await this.authTokenRepository.delete({
        user: { id: user.id },
        expires_at: LessThan(new Date()),
      });

      // Guardar el nuevo refresh token
      const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      const newTokenEntity = this.authTokenRepository.create({
        refresh_token_hash: refreshTokenHash,
        user: user,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await this.authTokenRepository.save(newTokenEntity);

      return { organization, newAccessToken, newRefreshToken };
    }
}
