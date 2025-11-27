import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from 'src/modules/organization/entities/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user || !user.organizations || user.organizations.length === 0) {
      // Si no hay usuario o no pertenece a ninguna organización, denegar el acceso
      return false;
    }

    const organizationId = request.params.organizationId;
    if (!organizationId) {
      // Si el endpoint requiere un organizationId pero no está presente en los parámetros, denegar
      // Esto puede ocurrir en endpoints que no tienen :organizationId en la ruta pero usan RolesGuard
      // Dependiendo de la lógica, se podría lanzar una excepción BadRequest aquí
      return false;
    }

    const userOrg = user.organizations.find(org => org.id === organizationId);

    if (!userOrg) {
      // El usuario no pertenece a la organización a la que intenta acceder
      return false;
    }

    const userRoleInOrganization = userOrg.role;

    return requiredRoles.some((role) => userRoleInOrganization === role);
  }
}
