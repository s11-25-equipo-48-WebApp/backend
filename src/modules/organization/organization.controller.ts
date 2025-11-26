import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards, Res, HttpCode, HttpStatus, Logger } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiBody, ApiParam } from "@nestjs/swagger";
import { OrganizationService } from "./organization.service";
import { JwtAuthGuard } from "src/jwt/jwt.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "../auth/entities/enums";
import { AddOrganizationMemberDto, UpdateOrganizationDto, UpdateOrganizationMemberRoleDto, CreateOrganizationDto } from "./dto/organization.dto";
import { CreateOrganizationMemberDto } from "./dto/create-organization-member.dto"; // Importar el nuevo DTO
import { OrganizationMemberDto } from "./dto/organization-member.dto"; // Importar OrganizationMemberDto
import { AuthService } from "src/modules/auth/auth.service";
import type { Response } from 'express';
import { ConfigService } from "@nestjs/config";


@ApiTags('Organization')
@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
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
    if (user.organization?.id) {
      throw new BadRequestException('El usuario ya pertenece a una organización.');
    }

    const { organization, newAccessToken, newRefreshToken } = await this.organizationService.createOrganizationAndAssignUser(
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
      organizationId: organization.id,
      accessToken: newAccessToken,
      userRole: organization.role,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Obtener detalles de la organización del token' })
  @ApiOkResponse({ description: 'Detalles de la organización' })
  async getOrganizationDetails(@Req() req) {
    const user = req.user;
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.getOrganizationDetails(user.organization.id);
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
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.updateOrganization(user.organization.id, updateDto);
  }

  @Delete()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar la organización del token' })
  @ApiOkResponse({ description: 'Organización eliminada' })
  async deleteOrganization(@Req() req) {
    const user = req.user;
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    await this.organizationService.deleteOrganization(user.organization.id);
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
    if (!user || !user.organization?.id || !user.organization?.role) {
      throw new UnauthorizedException('No se encontró la información de la organización en el token.');
    }
    // Solo permitir añadir roles de EDITOR o ADMIN para usuarios normales
    if (user.organization.role === Role.ADMIN && (addMemberDto.role === Role.SUPERADMIN)) {
      throw new UnauthorizedException('Un administrador no puede agregar miembros con rol SUPERADMIN.');
    }
    Logger.log(`addMember: userId: ${user.id}, organizationId: ${user.organization.id}`);
    return this.organizationService.addMember(user.organization.id, addMemberDto);
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
    if (!user || !user.organization?.id || !user.organization?.role) {
      throw new UnauthorizedException('No se encontró la información de la organización en el token.');
    }
    // Un administrador no puede eliminarse a sí mismo ni a otros administradores o superadministradores
    if (user.organization.role === Role.ADMIN && (user.id === userId || (await this.organizationService.getOrganizationDetails(user.organization.id)).members.some(m => m.user.id === userId && (m.role === Role.ADMIN || m.role === Role.SUPERADMIN)))) {
      throw new UnauthorizedException('Un administrador no puede eliminar a otros administradores o superadministradores, ni eliminarse a sí mismo.');
    }
    await this.organizationService.removeMember(user.organization.id, userId);
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
    if (!user || !user.organization?.id || !user.organization?.role) {
      throw new UnauthorizedException('No se encontró la información de la organización en el token.');
    }
    // Un administrador no puede cambiar el rol de un superadministrador ni a sí mismo a un rol inferior
    if (user.organization.role === Role.ADMIN) {
      const targetMember = await this.organizationService.getOrganizationDetails(user.organization.id).then(org => org.members.find(m => m.user.id === userId));
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
    return this.organizationService.updateMemberRole(user.organization.id, userId, updateRoleDto);
  }

  @Post('members/register')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Registrar un nuevo usuario y asignarlo a la organización del token' })
  @ApiOkResponse({ description: 'Usuario registrado y asignado a la organización' })
  @ApiBody({
    type: CreateOrganizationMemberDto,
    examples: {
      a: {
        summary: 'Ejemplo de agregar un miembro existente con rol EDITOR (sin password)',
        value: { email: 'existente@example.com', role: Role.EDITOR },
      },
      b: {
        summary: 'Ejemplo de registro de un nuevo miembro con rol EDITOR (con password)',
        value: { email: 'nuevo@example.com', password: 'password123', role: Role.EDITOR },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async registerMember(
    @Body() createMemberDto: CreateOrganizationMemberDto,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    if (!user || !user.organization?.id || !user.organization?.role) {
      throw new UnauthorizedException('No se encontró la información de la organización en el token.');
    }

    // Un administrador no puede registrar miembros con rol SUPERADMIN
    if (user.organization.role === Role.ADMIN && createMemberDto.role === Role.SUPERADMIN) {
      throw new UnauthorizedException('Un administrador no puede registrar miembros con rol SUPERADMIN.');
    }

    const existingUser = await this.authService.findUserByEmail(createMemberDto.email);

    if (existingUser) {
      // Si el usuario ya existe, intentar añadirlo a la organización
      const organizationDetails = await this.organizationService.getOrganizationDetails(user.organization.id);
      const alreadyMember = organizationDetails.members.some(
        (member) => member.user.id === existingUser.id,
      );

      if (alreadyMember) {
        throw new BadRequestException('El usuario ya es miembro de esta organización.');
      }

      const addMemberDto: AddOrganizationMemberDto = {
        email: createMemberDto.email,
        role: createMemberDto.role || Role.EDITOR,
      };
      await this.organizationService.addMember(user.organization.id, addMemberDto);

      return {
        message: `Usuario ${existingUser.email} agregado a la organización exitosamente con rol ${addMemberDto.role}.`,
        id: existingUser.id,
        email: existingUser.email,
        organizationId: user.organization.id,
        role: addMemberDto.role,
      };
    } else {
      // Si el usuario no existe, registrarlo y asignarlo a la organización
      // Si no se proporciona contraseña, no se puede registrar un nuevo usuario
      if (!createMemberDto.password) {
        throw new BadRequestException('Se requiere una contraseña para registrar un nuevo usuario.');
      }

      const { id, accessToken, estado, createdAt, organization } = await this.authService.register(
        { email: createMemberDto.email, password: createMemberDto.password }, // Asegurarse de pasar la contraseña
        user.organization.id,
        createMemberDto.role || Role.EDITOR, // Por defecto asignamos EDITOR si no se especifica
      );

      return {
        message: 'Usuario registrado y asignado a la organización exitosamente.',
        id,
        accessToken,
        estado,
        createdAt,
        organization,
      };
    }
  }

  @Get('members/:userId') // Nuevo endpoint
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Solo ADMIN o SUPERADMIN pueden ver los detalles de un miembro
  @ApiOperation({ summary: 'Obtener detalles de un miembro de la organización' })
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
    @Param('userId') userId: string,
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.getOrganizationMemberDetails(user.organization.id, userId);
  }

  @Get('members')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: 'Obtener todos los miembros de la organización del token' })
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
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('No se encontró el ID de la organización en el token.');
    }
    return this.organizationService.getOrganizationMembers(user.organization.id);
  }
}
