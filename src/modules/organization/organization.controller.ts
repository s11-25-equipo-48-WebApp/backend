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
  Logger,
  ParseUUIDPipe,
  Query,
  NotFoundException,
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
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
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
  ) { }

  // ======================================================
  // PUBLIC ENDPOINT: LIST PUBLIC ORGANIZATIONS
  // ======================================================
  @Get("public")
  @Public()
  @ApiOperation({ summary: "Lista paginada pública de organizaciones" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: "Organizaciones públicas devueltas correctamente" })
  @ApiBadRequestResponse({ description: "Parámetros inválidos" })
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
  @ApiUnauthorizedResponse({ description: "Token inválido o ausente" })
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
  @ApiOperation({ summary: "Crear organización" })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiCreatedResponse({ description: "Organización creada correctamente" })
  @ApiBadRequestResponse({ description: "Validación fallida o conflictos" })
  @ApiUnauthorizedResponse({ description: "Usuario no autenticado" })
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
      //throw new BadRequestException("El usuario ya pertenece a una o más organizaciones.");
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
  @ApiOkResponse({ description: "Detalles devueltos correctamente" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
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
  @ApiOkResponse({ description: "Organización actualizada correctamente" })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
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
  @ApiOkResponse({ description: "Organización eliminada correctamente" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
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

  // Aquí agregamos el parámetro para Swagger:
  @ApiParam({
    name: "organizationId",
    type: "string",
    required: true,
    description: "ID de la organización",
  })

  @ApiBody({ type: AddOrganizationMemberDto })
  @ApiCreatedResponse({ description: "Miembro agregado correctamente" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiBadRequestResponse()
  async addMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: AddOrganizationMemberDto,
    @Req() req,
  ) {
    const { user } = req;

    //validamos si el usaurios existe con un rol de admin en nuestra organizacion en la misma organizacion
    const userOrg = user.organizations.find(o => o.id === organizationId);

    if (!userOrg || (userOrg.role !== Role.ADMIN && userOrg.role !== Role.SUPERADMIN)) {
      throw new UnauthorizedException("No tienes permisos para agregar miembros.");
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
  @ApiOkResponse({ description: "Miembro eliminado" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async removeMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    const { user } = req;

    // 1️⃣ Validar que el usuario pertenece a la organización
    const userOrg = user.organizations.find(o => o.id === organizationId);
    if (!userOrg) {
      throw new UnauthorizedException("No perteneces a esta organización.");
    }

    // 2️⃣ Llamar al service para eliminar el miembro
    await this.organizationService.removeMemberFromOrganization(
      organizationId,
      userId,
      user.id,   // id del usuario que hace la acción
    );

    return { message: "Miembro eliminado exitosamente" };
  }



  // ======================================================
  // MEMBERS → UPDATE ROLE
  // ======================================================
  @Patch(":organizationId/members/:userId/role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Actualizar rol de miembro" })
  @ApiOkResponse({ description: "Rol actualizado" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async updateMemberRole(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: UpdateOrganizationMemberRoleDto,
    @Req() req,
  ) {
    const { user } = req;

    // 1️⃣ Verificar que el usuario pertenece a la organización
    const userOrg = user.organizations.find(o => o.id === organizationId);
    if (!userOrg) throw new UnauthorizedException("No perteneces a esta organización.");

    // 2️⃣ Llamar al service para hacer la actualización
    return this.organizationService.updateMemberRoleInOrganization(
      organizationId,
      userId,
      user.id,   // id del usuario que hace la acción
      dto.role,
    );
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
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
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
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
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
  @ApiOperation({ summary: "Solicitudes pendientes de unión" })
  @ApiOkResponse({ description: "Solicitudes pendientes devueltas" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async getPendingMembers(
  @Param("organizationId", ParseUUIDPipe) organizationId: string,
) {
  if (!organizationId || organizationId.length !== 36) {
    throw new BadRequestException("ID de organización inválido");
  }
  return this.organizationService.getPendingJoinRequestsForOrganization(organizationId);
}


  // ======================================================
  // MEMBERS → APPROVE
  // ======================================================
  @Patch(":organizationId/members/:userId/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Aprobar solicitud de unión" })
  @ApiOkResponse({ description: "Solicitud aprobada" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async approveMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    const { user } = req;

    // 1️⃣ Validar que el usuario pertenece a la organización
    const userOrg = user.organizations.find(o => o.id === organizationId);
    if (!userOrg) {
      throw new UnauthorizedException("No perteneces a esta organización.");
    }

    // 2️⃣ Llamar al service
    await this.organizationService.approveJoinRequestForOrganization(organizationId, userId);

    return { message: "Solicitud aprobada exitosamente." };
  }

  // ======================================================
  // MEMBERS → REJECT
  // ======================================================
  @Delete(":organizationId/members/:userId/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("access-token")
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Rechazar solicitud de unión" })
  @ApiOkResponse({ description: "Solicitud rechazada" })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async rejectMember(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    const { user } = req;

    // 1️⃣ Validar que el usuario pertenece a la organización
    const userOrg = user.organizations.find(o => o.id === organizationId);
    if (!userOrg) {
      throw new UnauthorizedException("No perteneces a esta organización.");
    }

    // 2️⃣ Llamar al service
    await this.organizationService.rejectJoinRequestForOrganization(organizationId, userId);

    return { message: "Solicitud rechazada exitosamente." };
  }

}
