import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards, Res, HttpCode, HttpStatus, Logger } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiBody, ApiParam } from "@nestjs/swagger";
import { OrganizationService } from "./organization.service";
import { JwtAuthGuard } from "src/jwt/jwt.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
//import { Role } from "../auth/entities/enums";
import { AddOrganizationMemberDto, UpdateOrganizationDto, UpdateOrganizationMemberRoleDto, CreateOrganizationDto } from "./dto/organization.dto";
import { CreateOrganizationMemberDto } from "./dto/create-organization-member.dto"; // Importar el nuevo DTO
import { OrganizationMemberDto } from "./dto/organization-member.dto"; // Importar OrganizationMemberDto
import { AuthService } from "src/modules/auth/auth.service";
import type { Response } from 'express';
import { ConfigService } from "@nestjs/config";
import { Role } from "./entities/enums";


@ApiTags('Organization')
@Controller('organization')
@UseGuards(JwtAuthGuard) // Eliminar RolesGuard para endpoints que no requieren un rol de organización preexistente
@ApiBearerAuth('access-token')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  // ====================
  // Endpoints de Organización
  // ====================

  @Post()
  @ApiOperation({ summary: 'Crear una nueva organización y asignar al usuario' })
  @ApiOkResponse({ description: 'Organización creada y usuario asignado' })
  @ApiBody({
    type: CreateOrganizationDto,
    examples: {
      a: {
        summary: 'Ejemplo de creación de organización',
        value: { name: 'Mi Nueva Organización' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createOrganization(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    if (user.organizations && user.organizations.length > 0) {
      throw new BadRequestException('El usuario ya pertenece a una o más organizaciones.');
    }

    const { organizations, newAccessToken, newRefreshToken } = await this.organizationService.createOrganizationAndAssignUser(
      user.id,
      createOrganizationDto,
    );

    res.cookie('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      message: 'Organización creada y asignada exitosamente.',
      organizations: organizations,
      accessToken: newAccessToken,
    };
  }

  @Get(':organizationId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Obtener detalles de una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Detalles de la organización' })
  async getOrganizationDetails(
    @Param('organizationId') organizationId: string,
    @Req() req
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para acceder a esta organización o rol insuficiente.');
    }
    return this.organizationService.getOrganizationDetails(organizationId);
  }

  @Patch(':organizationId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
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
    @Param('organizationId') organizationId: string,
    @Body() updateDto: UpdateOrganizationDto,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para actualizar esta organización o rol insuficiente.');
    }
    return this.organizationService.updateOrganization(organizationId, updateDto);
  }

  @Delete(':organizationId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Organización eliminada' })
  async deleteOrganization(
    @Param('organizationId') organizationId: string,
    @Req() req
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para eliminar esta organización o rol insuficiente.');
    }
    await this.organizationService.deleteOrganization(organizationId);
    return { message: 'Organización eliminada exitosamente' };
  }

  // ====================
  // Endpoints de Miembros de Organización
  // ====================

  @Post(':organizationId/members')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Agregar un miembro a una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
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
    @Param('organizationId') organizationId: string,
    @Body() addMemberDto: AddOrganizationMemberDto,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para agregar miembros a esta organización o rol insuficiente.');
    }
    // Solo permitir añadir roles de EDITOR o ADMIN para usuarios normales
    if (userOrg.role === Role.ADMIN && (addMemberDto.role === Role.SUPERADMIN)) {
      throw new UnauthorizedException('Un administrador no puede agregar miembros con rol SUPERADMIN.');
    }
    Logger.log(`addMember: userId: ${user.id}, organizationId: ${organizationId}`);
    return this.organizationService.addMember(organizationId, addMemberDto);
  }

  @Delete(':organizationId/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar un miembro de una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario miembro (uuid)' })
  @ApiOkResponse({ description: 'Miembro eliminado' })
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para eliminar miembros de esta organización o rol insuficiente.');
    }
    // Un administrador no puede eliminarse a sí mismo ni a otros administradores o superadministradores
    if (userOrg.role === Role.ADMIN && (user.id === userId || (await this.organizationService.getOrganizationDetails(organizationId)).members.some(m => m.user.id === userId && (m.role === Role.ADMIN || m.role === Role.SUPERADMIN)))) {
      throw new UnauthorizedException('Un administrador no puede eliminar a otros administradores o superadministradores, ni eliminarse a sí mismo.');
    }
    await this.organizationService.removeMember(organizationId, userId);
    return { message: 'Miembro eliminado exitosamente' };
  }

  @Patch(':organizationId/members/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar el rol de un miembro de una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario miembro (uuid)' })
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
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateOrganizationMemberRoleDto,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para actualizar roles de miembros en esta organización o rol insuficiente.');
    }
    // Un administrador no puede cambiar el rol de un superadministrador ni a sí mismo a un rol inferior
    if (userOrg.role === Role.ADMIN) {
      const targetMember = await this.organizationService.getOrganizationDetails(organizationId).then(org => org.members.find(m => m.user.id === userId));
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
    return this.organizationService.updateMemberRole(organizationId, userId, updateRoleDto);
  }

  @Post(':organizationId/members/register')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Agregar un miembro (por ID de usuario o email) a una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Miembro agregado exitosamente' })
  @ApiBody({
    type: CreateOrganizationMemberDto,
    examples: {
      a: {
        summary: 'Agregar un miembro existente por ID de usuario con rol EDITOR',
        value: { userId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', role: Role.EDITOR },
      },
      b: {
        summary: 'Agregar un miembro existente por email con rol ADMIN',
        value: { email: 'existente@example.com', role: Role.ADMIN },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async registerMember(
    @Param('organizationId') organizationId: string,
    @Body() createMemberDto: CreateOrganizationMemberDto,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para agregar miembros a esta organización o rol insuficiente.');
    }

    // Un administrador no puede registrar miembros con rol SUPERADMIN
    if (userOrg.role === Role.ADMIN && createMemberDto.role === Role.SUPERADMIN) {
      throw new UnauthorizedException('Un administrador no puede asignar el rol SUPERADMIN.');
    }

    const { userId, email, role } = createMemberDto;

    if (userId) {
      return this.organizationService.addMemberById(organizationId, userId, role || Role.EDITOR);
    } else if (email) {
      return this.organizationService.addMemberByEmail(organizationId, email, role || Role.EDITOR);
    } else {
      // Esto no debería suceder si IsEitherDefined funciona correctamente, pero es una salvaguarda.
      throw new BadRequestException('Debe proporcionar un userId o un email para agregar un miembro.');
    }
  }

  @Get(':organizationId/members/:userId') // Nuevo endpoint
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Solo ADMIN o SUPERADMIN pueden ver los detalles de un miembro
  @ApiOperation({ summary: 'Obtener detalles de un miembro de una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario miembro (uuid)' })
  @ApiOkResponse({
    description: 'Detalles del miembro de la organización',
    type: OrganizationMemberDto, // Usar el DTO directamente
    schema: {
      example: {
        id: 'uuid-user',
        email: 'editor@example.com',
        name: 'editor',
        bio: 'Breve biografía del editor',
        avatarUrl: 'http://example.com/avatar.jpg',
        role: 'EDITOR',
        is_active: true,
        createdAt: '2025-11-26T01:00:00.000Z',
      },
    },
  })
  async getMemberDetails(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para ver detalles de miembros de esta organización o rol insuficiente.');
    }
    return this.organizationService.getOrganizationMemberDetails(organizationId, userId);
  }

  @Get(':organizationId/members')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: 'Obtener todos los miembros de una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ 
    description: 'Lista de miembros de la organización',
    type: [OrganizationMemberDto], // Indicar que devuelve un array del DTO
    schema: {
      example: [
        {
          id: 'uuid-user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          bio: 'Breve biografía del administrador',
          avatarUrl: 'http://example.com/avatar-admin.jpg',
          role: 'ADMIN',
          is_active: true,
          createdAt: '2025-11-26T01:00:00.000Z',
        },
        {
          id: 'uuid-user-2',
          email: 'editor@example.com',
          name: 'Editor User',
          bio: 'Breve biografía del editor',
          avatarUrl: 'http://example.com/avatar-editor.jpg',
          role: 'EDITOR',
          is_active: true,
          createdAt: '2025-11-26T01:00:00.000Z',
        },
      ],
    },
  })
  async getOrganizationMembers(
    @Param('organizationId') organizationId: string,
    @Req() req,
  ) {
    const user = req.user;
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!userOrg || ![Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR].includes(userOrg.role)) {
      throw new UnauthorizedException('No autorizado para ver miembros de esta organización o rol insuficiente.');
    }
    return this.organizationService.getOrganizationMembers(organizationId);
  }
}
