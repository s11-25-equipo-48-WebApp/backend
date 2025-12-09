import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiQuery,
} from "@nestjs/swagger";

import { OrganizationService } from "./organization.service";
import { JwtAuthGuard } from "src/jwt/jwt.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Public } from "src/common/decorators/public.decorator";

import {
  AddOrganizationMemberDto,
  UpdateOrganizationDto,
  UpdateOrganizationMemberRoleDto,
  CreateOrganizationDto,
} from "./dto/organization.dto";

import { CreateOrganizationMemberDto } from "./dto/create-organization-member.dto";
import { OrganizationMemberDto } from "./dto/organization-member.dto";
import { GetOrganizationsQueryDto } from "./dto/get-organizations-query.dto";

import { Role } from "./entities/enums";
import type { Response } from "express";
import { ConfigService } from "@nestjs/config";

@ApiTags("Organization")
@Controller("organization")
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly configService: ConfigService,
  ) {}

  // ======================================================
  // PUBLIC ENDPOINT: LIST PUBLIC ORGANIZATIONS
  // ======================================================
  @Get("public")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lista paginada pública de organizaciones" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiOkResponse({
    description: "Organizaciones públicas con ID, nombre y descripción",
  })
  async getAllPublicOrganizations(@Query() query: GetOrganizationsQueryDto) {
    return this.organizationService.findAllOrganizationsPublic(query.page, query.limit);
  }

  // ======================================================
  // USER → MY ORGANIZATIONS
  // ======================================================
  @Get("my-organizations")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Organizaciones del usuario autenticado" })
  @ApiOkResponse({ type: [OrganizationMemberDto] })
  async getMyOrganizations(@Req() req) {
    const { user } = req;
    new Logger(`getMyOrganizations: userId=${user?.id}`);
    return user?.id
      ? this.organizationService.getUserOrganizationsWithMembers(user.id)
      : [];
  }

  // ======================================================
  // CREATE ORGANIZATION
  // ======================================================
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Crear una organización y asignar al usuario" })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiBadRequestResponse({
    description: "Conflictos por nombre duplicado o usuario ya perteneciente",
  })
  @HttpCode(HttpStatus.CREATED)
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = req;

    if (!user?.id) {
      throw new UnauthorizedException("Usuario no autenticado.");
    }

    if (user.organizations?.length > 0) {
      throw new BadRequestException("El usuario ya pertenece a una o más organizaciones.");
    }

    const { organizations, newAccessToken, newRefreshToken } =
      await this.organizationService.createOrganizationAndAssignUser(user.id, dto);

    const isProd = this.configService.get("NODE_ENV") === "production";

    res.cookie("refresh-token", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      message: "Organización creada y asignada exitosamente.",
      organizations,
      accessToken: newAccessToken,
    };
  }

  // ======================================================
  // GET ORGANIZATION DETAILS
  // ======================================================
  @Get(":organizationId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Detalles de una organización" })
  @ApiParam({ name: "organizationId", type: "string" })
  async getOrganizationDetails(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizationService.getOrganizationDetails(organizationId);
  }

  // ======================================================
  // UPDATE ORGANIZATION
  // ======================================================
  @Patch(":organizationId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Actualizar organización" })
  async updateOrganization(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.updateOrganization(organizationId, dto);
  }

  // ======================================================
  // DELETE ORGANIZATION
  // ======================================================
  @Delete(":organizationId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Eliminar organización" })
  async deleteOrganization(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    await this.organizationService.deleteOrganization(organizationId);
    return { message: "Organización eliminada exitosamente" };
  }

  // ======================================================
  // MEMBERS → ADD
  // ======================================================
  @Post(":organizationId/members")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Agregar miembro" })
  @ApiBody({ type: AddOrganizationMemberDto })
  async addMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: AddOrganizationMemberDto,
    @Req() req,
  ) {
    const { user } = req;
    const userOrg = user.organizations.find(o => o.id === organizationId);

    if (userOrg.role === Role.ADMIN && dto.role === Role.SUPERADMIN) {
      throw new UnauthorizedException("Un administrador no puede agregar SUPERADMIN.");
    }

    Logger.log(`addMember: userId=${user.id}, organizationId=${organizationId}`);

    return this.organizationService.addMember(organizationId, dto);
  }

  // ======================================================
  // MEMBERS → REMOVE
  // ======================================================
  @Delete(":organizationId/members/:userId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Eliminar miembro" })
  async removeMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    const { user } = req;
    const userOrg = user.organizations.find(o => o.id === organizationId);

    const org = await this.organizationService.getOrganizationDetails(organizationId);
    const target = org.members.find(m => m.user.id === userId);

    const isTargetProtected =
      target?.role === Role.ADMIN || target?.role === Role.SUPERADMIN;

    if (userOrg.role === Role.ADMIN) {
      if (user.id === userId || isTargetProtected) {
        throw new UnauthorizedException(
          "Un administrador no puede eliminar admin/superadmin ni eliminarse a sí mismo.",
        );
      }
    }

    await this.organizationService.removeMember(organizationId, userId);
    return { message: "Miembro eliminado exitosamente" };
  }

  // ======================================================
  // MEMBERS → UPDATE ROLE
  // ======================================================
  @Patch(":organizationId/members/:userId/role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Actualizar rol" })
  async updateMemberRole(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: UpdateOrganizationMemberRoleDto,
    @Req() req,
  ) {
    const { user } = req;
    const userOrg = user.organizations.find(o => o.id === organizationId);

    if (userOrg.role === Role.ADMIN) {
      const org = await this.organizationService.getOrganizationDetails(organizationId);
      const target = org.members.find(m => m.user.id === userId);

      if (target?.role === Role.SUPERADMIN) {
        throw new UnauthorizedException("Un administrador no puede modificar SUPERADMIN.");
      }
      if (target?.role === Role.ADMIN && dto.role !== Role.ADMIN) {
        throw new UnauthorizedException("No puedes degradar a otro admin.");
      }
      if (user.id === userId && dto.role !== Role.ADMIN) {
        throw new UnauthorizedException("No puedes degradarte a ti mismo.");
      }
      if (dto.role === Role.SUPERADMIN) {
        throw new UnauthorizedException("Un admin no puede asignar SUPERADMIN.");
      }
    }

    return this.organizationService.updateMemberRole(organizationId, userId, dto);
  }

  // ======================================================
  // MEMBERS → REGISTER (ID or EMAIL)
  // ======================================================
  @Post(":organizationId/members/register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Registrar miembro por ID o email" })
  @ApiBody({ type: CreateOrganizationMemberDto })
  async registerMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateOrganizationMemberDto,
    @Req() req,
  ) {
    const { user } = req;
    const userOrg = user.organizations.find(o => o.id === organizationId);

    if (userOrg.role === Role.ADMIN && dto.role === Role.SUPERADMIN) {
      throw new UnauthorizedException("Un administrador no puede asignar SUPERADMIN.");
    }

    if (dto.userId) {
      return this.organizationService.addMemberById(organizationId, dto.userId, dto.role);
    }
    if (dto.email) {
      return this.organizationService.addMemberByEmail(organizationId, dto.email, dto.role);
    }

    throw new BadRequestException("Debe proporcionar userId o email.");
  }

  // ======================================================
  // MEMBERS → DETAILS
  // ======================================================
  @Get(":organizationId/members/:userId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Detalles de un miembro" })
  @ApiOkResponse({ type: OrganizationMemberDto })
  async getMemberDetails(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    return this.organizationService.getOrganizationMemberDetails(organizationId, userId);
  }

  // ======================================================
  // MEMBERS → LIST
  // ======================================================
  @Get(":organizationId/members")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: "Listar miembros" })
  @ApiOkResponse({ type: [OrganizationMemberDto] })
  async getOrganizationMembers(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizationService.getOrganizationMembers(organizationId);
  }

  // ======================================================
  // MEMBERS → PENDING REQUESTS
  // ======================================================
  @Get(":organizationId/members/pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Solicitudes pendientes" })
  async getPendingMembers(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizationService.getPendingJoinRequests(organizationId);
  }

  // ======================================================
  // MEMBERS → APPROVE
  // ======================================================
  @Patch(":organizationId/members/:userId/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Aprobar solicitud de unión" })
  async approveMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    await this.organizationService.approveJoinRequest(organizationId, userId);
    return { message: "Solicitud aprobada exitosamente." };
  }

  // ======================================================
  // MEMBERS → REJECT
  // ======================================================
  @Delete(":organizationId/members/:userId/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rechazar solicitud de unión" })
  async rejectMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    await this.organizationService.rejectJoinRequest(organizationId, userId);
    return { message: "Solicitud rechazada exitosamente." };
  }
}
