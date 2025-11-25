import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiBody } from "@nestjs/swagger";
import { OrganizationService } from "./organization.service";
import { JwtAuthGuard } from "src/jwt/jwt.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "../auth/entities/enums";
import { AddOrganizationMemberDto, UpdateOrganizationDto, UpdateOrganizationMemberRoleDto } from "./dto/organization.dto";


@ApiTags('organization')
@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
  
  // ====================
  // Endpoints de Organización
  // ====================

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Obtener detalles de la organización del token' })
  @ApiOkResponse({ description: 'Detalles de la organización' })
  async getOrganizationDetails(@Req() req) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.getOrganizationDetails(user.organizationId);
  }

  @Patch()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar la organización del token' })
  @ApiOkResponse({ description: 'Organización actualizada' })
  @ApiBody({
    type: UpdateOrganizationDto,
    examples: {
      a: {
        summary: 'Ejemplo de actualización de nombre de organización',
        value: { name: 'Nuevo Nombre de Organización' },
      },
    },
  })
  async updateOrganization(
    @Body() updateDto: UpdateOrganizationDto,
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.updateOrganization(user.organizationId, updateDto);
  }

  @Delete()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar la organización del token' })
  @ApiOkResponse({ description: 'Organización eliminada' })
  async deleteOrganization(@Req() req) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    await this.organizationService.deleteOrganization(user.organizationId);
    return { message: 'Organización eliminada exitosamente' };
  }

  // ====================
  // Endpoints de Miembros de Organización
  // ====================

  @Post('members')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Agregar un miembro a la organización del token' })
  @ApiOkResponse({ description: 'Miembro agregado' })
  @ApiBody({
    type: AddOrganizationMemberDto,
    examples: {
      a: {
        summary: 'Ejemplo de agregar un miembro por email con rol EDITOR',
        value: { email: 'nuevo.miembro@example.com', role: Role.EDITOR },
      },
    },
  })
  async addMember(
    @Body() addMemberDto: AddOrganizationMemberDto,
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    // Solo permitir añadir roles de EDITOR o ADMIN para usuarios normales
    if (user.role === Role.ADMIN && (addMemberDto.role === Role.SUPERADMIN)) {
        throw new UnauthorizedException('Un administrador no puede agregar miembros con rol SUPERADMIN.');
    }
    return this.organizationService.addMember(user.organizationId, addMemberDto);
  }

  @Delete('members/:userId')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar un miembro de la organización del token' })
  @ApiOkResponse({ description: 'Miembro eliminado' })
  async removeMember(
    @Param('userId') userId: string,
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    // Un administrador no puede eliminarse a sí mismo ni a otros administradores o superadministradores
    if (user.role === Role.ADMIN && (user.id === userId || (await this.organizationService.getOrganizationDetails(user.organizationId)).members.some(m => m.user.id === userId && (m.role === Role.ADMIN || m.role === Role.SUPERADMIN)))) {
        throw new UnauthorizedException('Un administrador no puede eliminar a otros administradores o superadministradores, ni eliminarse a sí mismo.');
    }
    await this.organizationService.removeMember(user.organizationId, userId);
    return { message: 'Miembro eliminado exitosamente' };
  }

  @Patch('members/:userId/role')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar el rol de un miembro de la organización del token' })
  @ApiOkResponse({ description: 'Rol del miembro actualizado' })
  @ApiBody({
    type: UpdateOrganizationMemberRoleDto,
    examples: {
      a: {
        summary: 'Ejemplo de actualización de rol a EDITOR',
        value: { role: Role.EDITOR },
      },
      b: {
        summary: 'Ejemplo de actualización de rol a ADMIN',
        value: { role: Role.ADMIN },
      },
    },
  })
  async updateMemberRole(
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateOrganizationMemberRoleDto,
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    // Un administrador no puede cambiar el rol de un superadministrador ni a sí mismo a un rol inferior
    if (user.role === Role.ADMIN) {
        const targetMember = await this.organizationService.getOrganizationDetails(user.organizationId).then(org => org.members.find(m => m.user.id === userId));
        if (targetMember && targetMember.role === Role.SUPERADMIN) {
            throw new UnauthorizedException('Un administrador no puede cambiar el rol de un SUPERADMIN.');
        }
        if (user.id === userId && updateRoleDto.role !== Role.ADMIN) { // Si el admin intenta cambiarse a sí mismo a un rol que no sea admin.
            throw new UnauthorizedException('Un administrador no puede cambiar su propio rol a uno inferior.');
        }
        if (targetMember && targetMember.role === Role.ADMIN && updateRoleDto.role !== Role.ADMIN) {
            throw new UnauthorizedException('Un administrador no puede cambiar el rol de otro ADMINISTRADOR.');
        }
        if (updateRoleDto.role === Role.SUPERADMIN) {
            throw new UnauthorizedException('Un administrador no puede asignar el rol SUPERADMIN.');
        }
    }
    return this.organizationService.updateMemberRole(user.organizationId, userId, updateRoleDto);
  }

  @Get('members')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: 'Obtener todos los miembros de la organización del token' })
  @ApiOkResponse({ description: 'Lista de miembros de la organización' })
  async getOrganizationMembers(
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.getOrganizationMembers(user.organizationId);
  }
}
