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
import { Embed } from "../embedb/entities/embed.entity";
import { OrganizationMemberDto } from "./dto/organization-member.dto";

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
        @InjectRepository(Embed)
        private readonly embeRepository: Repository<Embed>,

    ) { }

    async getOrganizationDetails(organizationId: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
            relations: ['members', 'members.user'], // Cargar la relación 'members' y 'members.user'
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

    async getOrganizationMembers(organizationId: string): Promise<OrganizationMemberDto[]> {
        const members = await this.organizationUserRepository.find({
            where: { organization: { id: organizationId } },
            relations: ['user', 'user.profile'],
        });

        if (!members || members.length === 0) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada o sin miembros.`);
        }

        return members.map(member => ({
            id: member.user.id,
            email: member.user.email,
            name: member.user.name || null,
            bio: member.user.profile?.bio || null,
            avatarUrl: member.user.profile?.avatar_url || null,
            role: member.role,
            is_active: member.user.is_active,
            createdAt: member.user.created_at,
        }));
    }

    async getOrganizationMemberDetails(organizationId: string, userId: string): Promise<OrganizationMemberDto> {
        const member = await this.organizationUserRepository.findOne({
            where: { organization: { id: organizationId }, user: { id: userId } },
            relations: ['user', 'user.profile'],
        });

        if (!member) {
            throw new NotFoundException(`Miembro con ID de usuario ${userId} no encontrado en la organización ${organizationId}.`);
        }

        // Mapear a OrganizationMemberDto para una respuesta limpia sin el ID de la organización y con los detalles del usuario.
        return {
            id: member.user.id,
            email: member.user.email,
            name: member.user.name || null,
            bio: member.user.profile?.bio || null,
            avatarUrl: member.user.profile?.avatar_url || null,
            role: member.role,
            is_active: member.user.is_active,
            createdAt: member.user.created_at,
        };
    }

    async createOrganizationAndAssignUser(
        userId: string,
        createOrganizationDto: CreateOrganizationDto,
    ): Promise<{ organization: { id: string, name: string, role: Role }; newAccessToken: string; newRefreshToken: string }> {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        const existingOrgUser = await this.organizationUserRepository.findOne({
            where: { user: { id: userId } },
        });
        if (existingOrgUser) {
            throw new BadRequestException('El usuario ya pertenece a una organización.');
        }


        const organization = this.organizationRepository.create({
            name: createOrganizationDto.name,
        });
        await this.organizationRepository.save(organization);

        const organizationUser = this.organizationUserRepository.create({
            user: user,
            organization: organization,
            role: Role.ADMIN,
        });
        await this.organizationUserRepository.save(organizationUser);

        const embedb = this.embeRepository.create({
            width: 1280,
            height: 720,
            theme: 'dark',
            autoplay: false,
        });
        await this.embeRepository.save(embedb);
        organization.embed = embedb;
        await this.organizationRepository.save(organization);

        const organizationPayload = { id: organization.id, name: organization.name, role: organizationUser.role };
        const payload = { sub: user.id, email: user.email, organization: organizationPayload };

        const newAccessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '15m',
        });

        const newRefreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        await this.authTokenRepository.update(
            { user: { id: user.id }, revoked: false },
            { revoked: true },
        );
        await this.authTokenRepository.delete({
            user: { id: user.id },
            expires_at: LessThan(new Date()),
        });

        const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
        const newTokenEntity = this.authTokenRepository.create({
            refresh_token_hash: refreshTokenHash,
            user: user,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await this.authTokenRepository.save(newTokenEntity);

        return { organization: organizationPayload, newAccessToken, newRefreshToken };
    }
}
