import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/modules/organization/entities/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { OrganizationUser } from 'src/modules/organization/entities/organization_user.entity';

@Injectable()
export class TestimonioRolesGuard implements CanActivate {
  private readonly logger = new Logger(TestimonioRolesGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(Testimonio)
    private testimonioRepository: Repository<Testimonio>,
    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const testimonioId = request.params.id;

    if (!user || !user.id) {
      this.logger.warn('Usuario no autenticado intentando acceder');
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!testimonioId) {
      this.logger.warn('ID de testimonio no proporcionado');
      throw new ForbiddenException('ID de testimonio no proporcionado');
    }

    this.logger.log(`Verificando permisos para usuario ${user.id} en testimonio ${testimonioId}`);

    // Obtener el testimonio con su organización
    const testimonio = await this.testimonioRepository.findOne({
      where: { id: testimonioId },
      relations: ['organization'],
    });

    if (!testimonio) {
      this.logger.warn(`Testimonio ${testimonioId} no encontrado`);
      throw new NotFoundException('Testimonio no encontrado');
    }

    if (!testimonio.organization) {
      this.logger.warn(`Testimonio ${testimonioId} no tiene organización asociada`);
      throw new ForbiddenException('El testimonio no pertenece a ninguna organización');
    }

    // Verificar el rol del usuario en la organización del testimonio
    const organizationUser = await this.organizationUserRepository.findOne({
      where: {
        user: { id: user.id },
        organization: { id: testimonio.organization.id },
      },
    });

    if (!organizationUser) {
      this.logger.warn(`Usuario ${user.id} no es miembro de la organización ${testimonio.organization.id}`);
      throw new ForbiddenException('No eres miembro de esta organización');
    }

    const hasRole = requiredRoles.some((role) => organizationUser.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Usuario ${user.id} con rol ${organizationUser.role} intentó acceder a recurso que requiere roles: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException(
        `No tienes los permisos necesarios. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`
      );
    }

    this.logger.log(`Usuario ${user.id} autorizado con rol ${organizationUser.role}`);
    return true;
  }
}
