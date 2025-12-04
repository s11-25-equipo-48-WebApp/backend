import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards, Res, HttpCode, HttpStatus, Logger } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiBody, ApiParam, ApiBadRequestResponse } from "@nestjs/swagger";
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
import { Query } from "@nestjs/common"; // Importar Query
import { ConfigService } from "@nestjs/config"; // Importar ConfigService de @nestjs/config
import { Role } from "./entities/enums";
import { Public } from "src/common/decorators/public.decorator";
import { GetOrganizationsQueryDto } from "./dto/get-organizations-query.dto"; // Importar el nuevo DTO
import { ApiQuery } from "@nestjs/swagger"; // Importar ApiQuery

@ApiTags('Organization')
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly configService: ConfigService,
  ) { }

  // ====================
  // Endpoint público para listar organizaciones
  // Este endpoint NO requiere autenticación ni roles.
  // ====================
  @Get('public')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una lista pública paginada de todas las organizaciones (id, nombre, descripción)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página', example: 20 })
  @ApiOkResponse({
    description: 'Lista paginada de todas las organizaciones con ID, nombre y descripción.',
    schema: {
      example: {
        data: [
          { id: 'uuid-organization-1', name: 'Organización A', description: 'Descripción de la Organización A.' },
          { id: 'uuid-organization-2', name: 'Organización B', description: 'Descripción de la Organización B.' },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    },
  })
  async getAllPublicOrganizations(
    @Query() query: GetOrganizationsQueryDto
  ) {
    const { page, limit } = query;
    return this.organizationService.findAllOrganizationsPublic(page, limit);
  }

  // ====================
  // Endpoints de Usuario y Organización
  // ====================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('my-organizations')
  @ApiOperation({ summary: 'Obtener las organizaciones a las que pertenece el usuario autenticado' })
  @ApiOkResponse({ description: 'Lista de organizaciones del usuario', type: [OrganizationMemberDto] })
  async getMyOrganizations(@Req() req) {
    const user = req.user;
    if (!user || !user.id) {
      return [];
    }
    return this.organizationService.getUserOrganizationsWithMembers(user.id);
  }

  // Ver una organziacion en especifico
  // ====================
  // Endpoints de Organización
  // ====================
  // se mejoro la return , se agrego descripcion de la organizacion
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva organización y asignar al usuario' })
  @ApiOkResponse({
    description: 'Organización creada y usuario asignado',
    schema: {
      example: {
        message: 'Organización creada y asignada exitosamente.',
        organizations: [
          {
            id: 'uuid-organization-1',
            name: 'Mi Nueva Organización',
            description: 'Descripción de mi nueva organización.',
            role: 'ADMIN',
          },
        ],
        accessToken: 'jwt-access-token',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Ya existe una organización con este nombre o el usuario ya pertenece a una organización.',
    schema: {
      examples: {
        nameConflict: {
          summary: 'Conflicto de nombre de organización',
          value: {
            statusCode: 400,
            message: 'Ya existe una organización con este nombre.',
            error: 'Bad Request',
          },
        },
        userAlreadyInOrg: {
          summary: 'Usuario ya pertenece a una organización',
          value: {
            statusCode: 400,
            message: 'El usuario ya pertenece a una o más organizaciones.',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiBody({
    type: CreateOrganizationDto,
    examples: {
      a: {
        summary: 'Ejemplo de creación de organización',
        value: { name: 'Mi Nueva Organización', description: 'Descripción de mi nueva organización.' },
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

    const isProd = this.configService.get('NODE_ENV') === 'production';

    res.cookie('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });


    return {
      message: 'Organización creada y asignada exitosamente.',
      organizations: organizations,
      accessToken: newAccessToken,
    };
  }

  @Get(':organizationId')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener detalles de una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({
    description: 'Detalles de la organización',
    schema: {
      example: {
        id: 'uuid-organization-1',
        name: 'Nombre de la Organización',
        description: 'Descripción detallada de la organización.',
        // Otros campos como `members`, `testimonios`, `categories`, `tags`, `embed`, `createdAt`
      },
    },
  })
  async getOrganizationDetails(
    @Param('organizationId') organizationId: string,
    @Req() req
  ) {
    // La verificación de roles y pertenencia a la organización ahora se maneja por RolesGuard
    return this.organizationService.getOrganizationDetails(organizationId);
  }

  @Patch(':organizationId')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Organización actualizada' })
  @ApiBody({
    type: UpdateOrganizationDto,
    examples: {
      a: {
        summary: 'Ejemplo de actualización de nombre y descripción de organización',
        value: { name: 'Nuevo Nombre de Organización', description: 'Nueva descripción de la organización.' },
      },
    },
  })
  async updateOrganization(
    @Param('organizationId') organizationId: string,
    @Body() updateDto: UpdateOrganizationDto,
    @Req() req,
  ) {
    // La verificación de roles y pertenencia a la organización ahora se maneja por RolesGuard
    return this.organizationService.updateOrganization(organizationId, updateDto);
  }

  @Delete(':organizationId')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Organización eliminada' })
  async deleteOrganization(
    @Param('organizationId') organizationId: string,
    @Req() req
  ) {
    // La verificación de roles y pertenencia a la organización ahora se maneja por RolesGuard
    await this.organizationService.deleteOrganization(organizationId);
    return { message: 'Organización eliminada exitosamente' };
  }

  // ====================
  // Endpoints de Miembros de Organización
  // ====================

  @Post(':organizationId/members')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
    // Solo permitir añadir roles de EDITOR o ADMIN para usuarios normales
    if (userOrg.role === Role.ADMIN && (addMemberDto.role === Role.SUPERADMIN)) {
      throw new UnauthorizedException('Un administrador no puede agregar miembros con rol SUPERADMIN.');
    }
    Logger.log(`addMember: userId: ${user.id}, organizationId: ${organizationId}`);
    return this.organizationService.addMember(organizationId, addMemberDto);
  }

  @Delete(':organizationId/members/:userId')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
    // Un administrador no puede eliminarse a sí mismo ni a otros administradores o superadministradores
    if (userOrg.role === Role.ADMIN && (user.id === userId || (await this.organizationService.getOrganizationDetails(organizationId)).members.some(m => m.user.id === userId && (m.role === Role.ADMIN || m.role === Role.SUPERADMIN)))) {
      throw new UnauthorizedException('Un administrador no puede eliminar a otros administradores o superadministradores, ni eliminarse a sí mismo.');
    }
    await this.organizationService.removeMember(organizationId, userId);
    return { message: 'Miembro eliminado exitosamente' };
  }

  @Patch(':organizationId/members/:userId/role')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
        testimonioCount: 12,
      },
    },
  })
  async getMemberDetails(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    // La verificación de roles y pertenencia a la organización ahora se maneja por RolesGuard
    return this.organizationService.getOrganizationMemberDetails(organizationId, userId);
  }

  @Get(':organizationId/members')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
          testimonioCount: 15,
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
          testimonioCount: 8,
        },
      ],
    },
  })
  async getOrganizationMembers(
    @Param('organizationId') organizationId: string,
    @Req() req,
  ) {
    // La verificación de roles y pertenencia a la organización ahora se maneja por RolesGuard
    return this.organizationService.getOrganizationMembers(organizationId);
  }

  @Get(':organizationId/members/pending')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Obtener todas las solicitudes de unión pendientes para una organización específica' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({
    description: 'Lista de miembros con solicitudes pendientes',
    type: [OrganizationMemberDto],
    schema: {
      example: [
        {
          id: 'uuid-user-3',
          email: 'pending@example.com',
          name: 'Pending User',
          bio: null,
          avatarUrl: null,
          role: 'EDITOR', // Rol asignado en la solicitud, pero inactivo
          is_active: false,
          createdAt: '2025-11-26T01:00:00.000Z',
        },
      ],
    },
  })
  async getPendingMembers(
    @Param('organizationId') organizationId: string,
    @Req() req,
  ) {
    return this.organizationService.getPendingJoinRequests(organizationId);
  }

  @Patch(':organizationId/members/:userId/approve')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar una solicitud de unión de un miembro a una organización' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario miembro (uuid) cuya solicitud será aprobada' })
  @ApiOkResponse({ description: 'Miembro aprobado exitosamente' })
  async approveMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    await this.organizationService.approveJoinRequest(organizationId, userId);
    return { message: 'Solicitud de unión aprobada exitosamente.' };
  }

  @Delete(':organizationId/members/:userId/reject')
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una solicitud de unión de un miembro a una organización' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario miembro (uuid) cuya solicitud será rechazada' })
  @ApiOkResponse({ description: 'Miembro rechazado exitosamente' })
  async rejectMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    await this.organizationService.rejectJoinRequest(organizationId, userId);
    return { message: 'Solicitud de unión rechazada y eliminada exitosamente.' };
  }
}
