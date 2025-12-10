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
import * as bcrypt from "bcrypt";
import { Embed } from "../embedb/entities/embed.entity";
import { OrganizationMemberDto } from "./dto/organization-member.dto";
import { Role } from "./entities/enums"; // Importar Status
import { AuthService } from "src/modules/auth/auth.service"; // Importar AuthService
import { StatusS, Testimonio } from "src/modules/testimonios/entities/testimonio.entity"; // Importar Testimonio
import { Category } from "src/modules/categories/entities/category.entity"; // Importar Category

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
        @InjectRepository(Testimonio)
        private readonly testimoniosRepository: Repository<Testimonio>, // Inyectar TestimonioRepository
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>, // Inyectar CategoryRepository
        private readonly authService: AuthService, // Inyectar AuthService
    ) { }

    async getUserOrganizationsWithMembers(userId: string): Promise<any[]> {
        const organizationUsers = await this.organizationUserRepository.find({
            where: { user: { id: userId } },
            relations: ['organization', 'organization.members', 'organization.members.user', 'organization.members.user.profile'],
        });

        if (!organizationUsers || organizationUsers.length === 0) {
            return [];
        }

        return organizationUsers.map(ou => {
            const org = ou.organization;
            const members = org.members.map(memberOu => ({
                id: memberOu.user.id,
                email: memberOu.user.email,
                name: memberOu.user.name || null,
                bio: memberOu.user.profile?.bio || null,
                avatarUrl: memberOu.user.profile?.avatar_url || null,
                role: memberOu.role,
                is_active: memberOu.user.is_active,
                createdAt: memberOu.user.created_at,
            }));

            return {
                id: org.id,
                name: org.name,
                description: org.description,
                role: ou.role, // Rol del usuario actual en esta organización
                editors: members.filter(m => m.role === Role.EDITOR).length,
                members: members.length,
                createdAt: org.createdAt,
                allMembers: members, // Opcional: para tener todos los detalles de los miembros si se necesitan
            };
        });
    }

    async getOrganizationDetails(organizationId: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
            relations: ['members', 'members.user', 'members.user.profile'], // Cargar miembros aquí también
        });

        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }

        const approvedTestimonios = await this.testimoniosRepository.find({
            where: {
                organization: { id: organizationId },
                status: StatusS.APROBADO,
            },
            relations: ['category', 'tags', 'author'],
        });

        organization.testimonios = approvedTestimonios;

        return organization;
    }

    async updateOrganization(organizationId: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
        const organization = await this.organizationRepository.findOneBy({ id: organizationId });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }
        organization.name = updateDto.name;
        organization.description = updateDto.description;
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

        // const existingMember = await this.organizationUserRepository.findOne({
        //     where: { organization: { id: organizationId }, user: { id: user.id } },
        // });

        // // Revisar si ya existe una relación para evitar duplicados
        // if (existingMember) {
        //     throw new BadRequestException('El usuario ya es miembro de esta organización.');
        // }
        // berificiar si el usuario es admin de la organizacion y no puede ser agregado

        if (user.organizations[0].role === Role.ADMIN && addMemberDto.role === Role.ADMIN) {
            throw new BadRequestException('No puedes agregar un admin a una organización.');
        }

        const newMember = this.organizationUserRepository.create({
            organization,
            user,
            role: addMemberDto.role,
        });
        return this.organizationUserRepository.save(newMember);
    }

    async addMemberById(organizationId: string, userId: string, role: Role = Role.EDITOR): Promise<OrganizationUser> {
        const organization = await this.organizationRepository.findOneBy({ id: organizationId });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }

        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
        }

        // const existingMember = await this.organizationUserRepository.findOne({
        //     where: { organization: { id: organizationId }, user: { id: user.id } },
        // });

        // if (existingMember) {
        //     throw new BadRequestException('El usuario ya es miembro de esta organización.');
        // }

        // berificiar si el usuario es admin de la organizacion y no puede ser agregado

        if (user.organizations[0].role === Role.ADMIN && role === Role.ADMIN) {
            throw new BadRequestException('No puedes agregar un admin a una organización.');
        }

        const newMember = this.organizationUserRepository.create({
            organization,
            user,
            role,
        });
        return this.organizationUserRepository.save(newMember);
    }

    async addMemberByEmail(organizationId: string, email: string, role: Role = Role.EDITOR): Promise<OrganizationUser> {
        const organization = await this.organizationRepository.findOneBy({ id: organizationId });
        if (!organization) {
            throw new NotFoundException(`Organización con ID ${organizationId} no encontrada.`);
        }

        const user = await this.usersRepository.findOneBy({ email });
        if (!user) {
            throw new NotFoundException(`Usuario con email ${email} no encontrado.`);
        }

        // const existingMember = await this.organizationUserRepository.findOne({
        //     where: { organization: { id: organizationId }, user: { id: user.id } },
        // });

        // if (existingMember) {
        //     throw new BadRequestException('El usuario ya es miembro de esta organización.');
        // }

        // berificiar si el usuario es admin de la organizacion y no puede ser agregado

        if (user.organizations[0].role === Role.ADMIN && role === Role.ADMIN) {
            throw new BadRequestException('No puedes agregar un admin a una organización.');
        }

        const newMember = this.organizationUserRepository.create({
            organization,
            user,
            role,
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

        // berificiar si el usuario es admin de la organizacion y no puede ser agregado

        if (member.user.organizations[0].role === Role.ADMIN && updateRoleDto.role === Role.ADMIN) {
            throw new BadRequestException('No puedes agregar un admin a una organización.');
        }
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

        // Obtener el conteo de testimonios aprobados para cada miembro
        const membersWithCount = await Promise.all(
            members.map(async (member) => {
                const testimonioCount = await this.testimoniosRepository.count({
                    where: {
                        created_by_user_id: member.user.id,
                        organization: { id: organizationId },
                        status: StatusS.APROBADO,
                    },
                });

                return {
                    id: member.user.id,
                    email: member.user.email,
                    name: member.user.name || null,
                    bio: member.user.profile?.bio || null,
                    avatarUrl: member.user.profile?.avatar_url || null,
                    role: member.role,
                    is_active: member.user.is_active,
                    createdAt: member.user.created_at,
                    testimonioCount,
                };
            })
        );

        return membersWithCount;
    }

    async getOrganizationMemberDetails(organizationId: string, userId: string): Promise<OrganizationMemberDto> {
        const member = await this.organizationUserRepository.findOne({
            where: { organization: { id: organizationId }, user: { id: userId } },
            relations: ['user', 'user.profile'],
        });

        if (!member) {
            throw new NotFoundException(`Miembro con ID de usuario ${userId} no encontrado en la organización ${organizationId}.`);
        }

        // Obtener el conteo de testimonios aprobados del miembro
        const testimonioCount = await this.testimoniosRepository.count({
            where: {
                created_by_user_id: member.user.id,
                organization: { id: organizationId },
                status: StatusS.APROBADO,
            },
        });

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
            testimonioCount,
        };
    }

    async createOrganizationAndAssignUser(
        userId: string,
        createOrganizationDto: CreateOrganizationDto,
    ): Promise<{ organizations: { id: string, name: string, role: Role }[]; newAccessToken: string; newRefreshToken: string }> {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        // const existingOrgUser = await this.organizationUserRepository.findOne({
        //     where: { user: { id: userId } },
        // });
        // if (existingOrgUser) {
        //     throw new BadRequestException('El usuario ya pertenece a una organización.');
        // }

        // Verificar si ya existe una organización con el mismo nombre
        const existingOrganizationByName = await this.organizationRepository.findOneBy({ name: createOrganizationDto.name });
        if (existingOrganizationByName) {
            throw new BadRequestException('Ya existe una organización con este nombre.');
        }

        const organization = this.organizationRepository.create({
            name: createOrganizationDto.name,
            description: createOrganizationDto.description,
        });
        await this.organizationRepository.save(organization);

        // Crear categorías por defecto
        const defaultCategories = ['producto', 'evento', 'cliente', 'industria'];
        const categoriesToCreate = defaultCategories.map(name =>
            this.categoryRepository.create({ name, organization }),
        );
        await this.categoryRepository.save(categoriesToCreate);

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

        // Obtener todas las organizaciones del usuario para el token
        const userOrganizations = await this.organizationUserRepository.find({
            where: { user: { id: user.id } },
            relations: ['organization'],
        });

        const organizationsPayload = userOrganizations.map(ou => ({
            id: ou.organization.id,
            name: ou.organization.name,
            description: ou.organization.description,
            role: ou.role,
        }));

        const newAccessToken = await this.authService.generateAccessTokenForUser(user);

        const payload = { sub: user.id, email: user.email, organizations: organizationsPayload };
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

        return { organizations: organizationsPayload, newAccessToken, newRefreshToken };
    }

    /**
     * Obtiene todas las solicitudes de unión pendientes (usuarios inactivos) para una organización.
     * @param organizationId El ID de la organización.
     * @returns Una lista de objetos OrganizationMemberDto para usuarios pendientes.
     */
    async getPendingJoinRequests(organizationId: string): Promise<OrganizationMemberDto[]> {
        const pendingMembers = await this.organizationUserRepository.find({
            where: {
                organization: { id: organizationId },
                is_active: false,
            },
            relations: ['user', 'user.profile'],
        });

        if (!pendingMembers || pendingMembers.length === 0) {
            return []; // O lanzar un NotFoundException si no hay solicitudes pendientes, según la lógica de negocio deseada
        }

        return pendingMembers.map(member => ({
            id: member.user.id,
            email: member.user.email,
            name: member.user.name || null,
            bio: member.user.profile?.bio || null,
            avatarUrl: member.user.profile?.avatar_url || null,
            role: member.role,
            is_active: member.is_active, // Usar member.is_active para mostrar el estado correcto
            createdAt: member.createdAt,
        }));
    }

    /**
     * Aprueba una solicitud de unión, activando al miembro de la organización.
     * @param organizationId El ID de la organización.
     * @param userId El ID del usuario cuya solicitud se va a aprobar.
     * @returns El objeto OrganizationUser actualizado.
     */
    async approveJoinRequest(organizationId: string, userId: string): Promise<OrganizationUser> {
        const member = await this.organizationUserRepository.findOne({
            where: {
                organization: { id: organizationId },
                user: { id: userId },
                is_active: false, // Solo aprobar solicitudes pendientes
            },
        });

        if (!member) {
            throw new NotFoundException(`Solicitud de unión pendiente para el usuario ${userId} en la organización ${organizationId} no encontrada.`);
        }

        member.is_active = true; // Activar al miembro
        return this.organizationUserRepository.save(member);
    }

    /**
     * Rechaza una solicitud de unión, eliminando al miembro de la organización.
     * @param organizationId El ID de la organización.
     * @param userId El ID del usuario cuya solicitud se va a rechazar.
     */
    async rejectJoinRequest(organizationId: string, userId: string): Promise<void> {
        const result = await this.organizationUserRepository.delete({
            organization: { id: organizationId },
            user: { id: userId },
            is_active: false, // Solo rechazar solicitudes pendientes
        });

        if (result.affected === 0) {
            throw new NotFoundException(`Solicitud de unión pendiente para el usuario ${userId} en la organización ${organizationId} no encontrada.`);
        }
    }

    /**
     * Obtiene una lista pública de todas las organizaciones con su ID, nombre y descripción.
     * Este endpoint no requiere autenticación.
     * @returns Una lista de objetos con id, name y description de cada organización.
     */
    async findAllOrganizationsPublic(page: number = 1, limit: number = 20): Promise<{ data: { id: string; name: string; description: string }[]; meta: { total: number; page: number; limit: number; totalPages: number; }; }> {
        const skip = (page - 1) * limit;

        const [organizations, total] = await this.organizationRepository.findAndCount({
            select: ['id', 'name', 'description'],
            take: limit,
            skip: skip,
            order: { name: 'ASC' }, // Ordenar por nombre para consistencia
        });

        return {
            data: organizations,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
