import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from 'src/modules/auth/entities/enums';

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
    const { user } = context.switchToHttp().getRequest();
    if (!user) { // Si no hay usuario (ej. JwtAuthGuard falló o no se autenticó), denegar el acceso
        console.log('[RolesGuard] Usuario no encontrado, denegando acceso.');
        return false;
    }
    console.log(`[RolesGuard] User global role: ${user.userRole}`);
    console.log(`[RolesGuard] Organization role: ${user.organizationRole}`);
    console.log(`[RolesGuard] Required roles: ${requiredRoles.join(', ')}`);

    const hasPermission = requiredRoles.some((role) => user.userRole === role);
    console.log(`[RolesGuard] Has permission (global role): ${hasPermission}`);

    // Si también queremos verificar el rol de la organización para algunos endpoints
    // if (user.organizationRole && requiredRoles.some((role) => user.organizationRole === role)) {
    //   console.log('[RolesGuard] Has permission (organization role): true');
    //   return true;
    // }

    return hasPermission;
  }
}
