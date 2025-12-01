import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { Organization } from 'src/modules/organization/entities/organization.entity';
import { OrganizationUser } from 'src/modules/organization/entities/organization_user.entity';
import { Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { UpdateTestimonioStatusDto } from './dto/update-testimonio-status.dto';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/userProfile.entity';
import { Status } from '../organization/entities/enums';
import { AuthToken } from '../auth/entities/authToken.entity';

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

      // Separar los datos del usuario y del perfil
      const { avatar_url, bio, metadata, ...userData } = updateUserDto;

      // Actualizar datos del usuario (name, email)
      if (Object.keys(userData).length > 0) {
        Object.assign(user, userData);
        await this.userRepository.save(user);
      }

      // Actualizar o crear el perfil si hay datos de perfil
      if (avatar_url !== undefined || bio !== undefined || metadata !== undefined) {
        if (user.profile) {
          // Actualizar perfil existente
          if (avatar_url !== undefined) user.profile.avatar_url = avatar_url;
          if (bio !== undefined) user.profile.bio = bio;
          if (metadata !== undefined) user.profile.metadata = metadata;
          
          await this.userProfileRepository.save(user.profile);
        } else {
          // Crear nuevo perfil
          const newProfile = this.userProfileRepository.create({
            user_id: userId,
            avatar_url: avatar_url || null,
            bio: bio || '',
            metadata: metadata || {},
          });
          
          await this.userProfileRepository.save(newProfile);
        }
      }

      // Retornar el usuario actualizado con su perfil
      return this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
        select: {
          id: true,
          email: true,
          name: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
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

    await this.organizationUserRepository.remove(membership);
  }

  async findMyTestimonios(userId: string): Promise<Testimonio[]> {
    return this.testimonioRepository.find({
      where: { author: { id: userId } },
      relations: ['category', 'tags'], // Cargar relaciones si es necesario
    });
  }

  async updateMyTestimonioStatus(userId: string, testimonioId: string, updateStatusDto: UpdateTestimonioStatusDto): Promise<Testimonio> {
    const testimonio = await this.testimonioRepository.findOne({
      where: { id: testimonioId, author: { id: userId } },
    });

    if (!testimonio) {
      throw new NotFoundException(`Testimonio with ID "${testimonioId}" not found or does not belong to user.`);
    }

    // Aquí se asume que el usuario puede cambiar el estado a borrador o similar.
    // Si hay restricciones de estado (ej. solo ADMIN puede aprobar), esto debería estar en una capa de autorización.
    testimonio.status = updateStatusDto.status;
    if (updateStatusDto.status === Status.PENDIENTE) {
      // Si se cambia a PENDIENTE, se puede asumir que sale del borrador y está listo para revisión.
      // O puedes tener un estado específico de 'BORRADOR'
    }

    return this.testimonioRepository.save(testimonio);
  }
}
