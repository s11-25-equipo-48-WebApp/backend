import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { Organization } from 'src/modules/organization/entities/organization.entity';
import { OrganizationUser } from 'src/modules/organization/entities/organization_user.entity';
import { StatusS, Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { UpdateTestimonioStatusDto } from './dto/update-testimonio-status.dto';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/userProfile.entity';
import { Role, Status } from '../organization/entities/enums';
import { AuthToken } from '../auth/entities/authToken.entity';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { profile } from 'console';

@Injectable()
export class UserService {
  private readonly logger: Logger;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private readonly organizationUserRepository: Repository<OrganizationUser>,
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    @InjectRepository(Testimonio)
    private readonly testimonioRepository: Repository<Testimonio>,
  ) {
    this.logger = new Logger(UserService.name)
  }

  async findMe(userId: string): Promise<any> {
    this.logger.log(`findMe: userId: ${userId}`);

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
        select: {
          id: true,
          email: true,
          name: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          profile: {
            avatar_url: true,
          }
        }
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error en findMe: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateMe(userId: string, updateUserDto: UpdateUserDto): Promise<any> {
    this.logger.log(`updateMe: userId: ${userId}`);

    try {
      // Buscar el usuario con su perfil
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      const { avatar_url, ...userData } = updateUserDto;

      // ------------------------------------
      // Actualizar datos del usuario
      // ------------------------------------
      if (userData.name !== undefined) {
        user.name = userData.name;
      }

      if (userData.last_name !== undefined) {
        user.last_name = userData.last_name;
      }

      // Guardar siempre el usuario (actualiza updated_at)
      await this.userRepository.save(user);

      // ------------------------------------
      // Actualizar / crear el perfil
      // ------------------------------------
      if (avatar_url !== undefined) {
        if (user.profile) {
          user.profile.avatar_url = avatar_url;
          await this.userProfileRepository.save(user.profile);
        }
      }

      // Retornar el usuario actualizado con su perfil
      return this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile']
      });

    } catch (error) {
      this.logger.error(`Error en updateMe: ${error.message}`, error.stack);
      throw error;
    }
  }


  async removeMe(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async findMyOrganizations(userId: string): Promise<OrganizationUser[]> {
    return this.organizationUserRepository.find({
      where: { user: { id: userId } },
      relations: ['organization'],
    });
  }

  async joinOrganization(userId: string, organizationId: string): Promise<OrganizationUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new NotFoundException(`Organization with ID "${organizationId}" not found`);
    }

    const existingMembership = await this.organizationUserRepository.findOne({
      where: { user: { id: userId }, organization: { id: organizationId } },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization.');
    }

    //evitar a que se agregue un admin a una organizacion

    if (user.organizations[0].role === Role.ADMIN) {
      throw new BadRequestException('No puedes agregar un admin a una organización.');
    }

    const organizationUser = this.organizationUserRepository.create({
      user,
      organization,
    });

    return this.organizationUserRepository.save(organizationUser);
  }

  async leaveOrganization(userId: string, organizationId: string): Promise<void> {
    const membership = await this.organizationUserRepository.findOne({
      where: { user: { id: userId }, organization: { id: organizationId } },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found or user is not part of this organization.');
    }

    //evitar a que se agregue un admin a una organizacion

    if (membership.user.organizations[0].role === Role.ADMIN) {
      throw new BadRequestException('No puedes agregar un admin a una organización.');
    }

    await this.organizationUserRepository.remove(membership);
  }

  async updateAvatar(userId: string, updateAvatarDto: UpdateAvatarDto) {
    this.logger.log(`updateAvatar: userId: ${userId}, ${(updateAvatarDto)}`);
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (!user.profile || !user.profile.avatar_url) {
      user.profile = this.userProfileRepository.create({
        user_id: userId,
        avatar_url: updateAvatarDto.avatar_url || '',
      });
    }
    this.logger.log(`updateAvatar: userId: ${userId}, user.profile: ${user.profile}`);


    if (updateAvatarDto.avatar_url) {
      user.profile.avatar_url = updateAvatarDto.avatar_url;
    }
    this.logger.log(`updateAvatar: userId: ${userId}, user.profile.avatar_url: ${user.profile.avatar_url}`);

    await this.userProfileRepository.save(user.profile);

    return { message: 'Avatar actualizado correctamente', avatar_url: user.profile.avatar_url };
  }

  // ver todos mis testimonios de todas las organizaciones
  async findMyTestimonios(userId: string): Promise<Testimonio[]> {
  return this.testimonioRepository
    .createQueryBuilder('testimonio')
    .leftJoinAndSelect('testimonio.organization', 'organization') // incluir info de la organización
    .leftJoinAndSelect('testimonio.created_by_user', 'user')     // incluir info del autor
    .where('testimonio.created_by_user_id = :userId', { userId }) // filtrar solo los creados por el usuario
    .orderBy('testimonio.created_at', 'DESC')
    .getMany();
}



  async findById(id: string, userId: string): Promise<Testimonio | null> {
  // 1. Obtener todas las organizaciones del usuario
  const orgUsers = await this.organizationUserRepository.find({
    where: { user: { id: userId } },
    relations: ['organization'],
  });

  const orgIds = orgUsers.map(ou => ou.organization.id);

  if (orgIds.length === 0) return null;

  // 2. Buscar el testimonio que coincida con el ID y esté en esas organizaciones
  return this.testimonioRepository.findOne({
    where: {
      id,
      organization: { id: In(orgIds) },
    },
  });
}

async removeTestimonio(id: string, userId: string): Promise<{ message: string }> {
  // 1. Traer las organizaciones del usuario
  const orgUsers = await this.organizationUserRepository.find({
    where: { user: { id: userId } },
    relations: ['organization'],
  });

  const orgIds = orgUsers.map(ou => ou.organization.id);

  if (orgIds.length === 0) {
    throw new NotFoundException('No tienes organizaciones asociadas.');
  }

  // 2. Buscar el testimonio dentro de esas organizaciones
  const testimonio = await this.testimonioRepository.findOne({
    where: {
      id,
      organization: { id: In(orgIds) },
    },
  });

  if (!testimonio) {
    throw new NotFoundException('Testimonio no encontrado o no autorizado.');
  }

  // 3. Eliminar
  await this.testimonioRepository.remove(testimonio);

  return { message: 'Testimonio eliminado correctamente' };
}

async findMyPendingTestimonios(userId: string): Promise<Testimonio[]> {
  return this.testimonioRepository
    .createQueryBuilder('testimonio')
    .leftJoinAndSelect('testimonio.organization', 'organization') // info de la organización
    .leftJoinAndSelect('testimonio.created_by_user', 'user')     // info del autor
    .where('testimonio.created_by_user_id = :userId', { userId }) // solo creados por el usuario
    .andWhere('testimonio.status = :status', { status: StatusS.PENDIENTE }) // solo pendientes
    .orderBy('testimonio.created_at', 'DESC')
    .getMany();
}
}
