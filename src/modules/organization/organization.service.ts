import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Organization } from "./entities/organization.entity";
import { OrganizationUser } from "./entities/organization_user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/modules/auth/entities/user.entity";
import { AddOrganizationMemberDto, UpdateOrganizationDto, UpdateOrganizationMemberRoleDto } from "./dto/organization.dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthToken } from "../auth/entities/authToken.entity";

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(User)
            private readonly usersRepository: Repository<User>,
            @InjectRepository(Organization)
            private readonly organizationRepository: Repository<Organization>,
            @InjectRepository(OrganizationUser)
            private readonly organizationUserRepository: Repository<OrganizationUser>,
        
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
}
