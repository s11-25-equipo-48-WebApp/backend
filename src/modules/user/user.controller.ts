import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, UnauthorizedException, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import type { RequestWithUser } from 'src/common/interfaces/RequestWithUser';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JoinOrganizationDto } from './dto/join-organization.dto';
import { UpdateTestimonioStatusDto } from './dto/update-testimonio-status.dto';
import type { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../organization/entities/enums';
import { TestimonioRolesGuard } from 'src/common/guards/testimonio-roles.guard';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener los datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findMe(@Req() req) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
        if (!user || !user.id) {
          throw new UnauthorizedException('Usuario no autenticado.');
        }
    return this.userService.findMe(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar los datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'El usuario ha sido actualizado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiBody({ type: UpdateUserDto, description: 'Datos a actualizar del usuario' })
  async updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.updateMe(req.user.id, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar la cuenta del usuario autenticado' })
  @ApiResponse({ status: 204, description: 'El usuario ha sido eliminado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async removeMe(@Req() req) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.removeMe(req.user.id);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Obtener todas las organizaciones a las que pertenece el usuario' })
  @ApiResponse({ status: 200, description: 'Lista de organizaciones del usuario.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async findMyOrganizations(@Req() req) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.findMyOrganizations(req.user.id);
  }

  @Post('organizations/join')
  @ApiOperation({ summary: 'Unirse a una organización (Prueba por si se requiere)' })
  @ApiResponse({ status: 201, description: 'Usuario unido a la organización.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada.' })
  @ApiResponse({ status: 409, description: 'El usuario ya es miembro de esta organización.' })
  @ApiBody({ type: JoinOrganizationDto, description: 'ID de la organización a la que unirse' })
  async joinOrganization(@Req() req, @Body() joinOrganizationDto: JoinOrganizationDto) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.joinOrganization(req.user.id, joinOrganizationDto.organizationId);
  }

  @Delete('organizations/:id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Salir de una organización' })
  @ApiResponse({ status: 204, description: 'Usuario ha salido de la organización.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada.' })
  async leaveOrganization(@Req() req, @Param('id') organizationId: string) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.leaveOrganization(req.user.id, organizationId);
  }

  @Get('testimonios')
  @ApiOperation({ summary: 'Obtener todos los testimonios del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de testimonios del usuario.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async findMyTestimonios(@Req() req) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.findMyTestimonios(req.user.id);
  }

  @Patch('testimonios/:id/status')
  @UseGuards(JwtAuthGuard, TestimonioRolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar el estado de un testimonio (Solo ADMIN o SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'El estado del testimonio ha sido actualizado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos suficientes (se requiere rol ADMIN o SUPERADMIN).' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado.' })
  @ApiBody({ type: UpdateTestimonioStatusDto, description: 'Nuevo estado del testimonio' })
  async updateMyTestimonioStatus(@Req() req, @Param('id') testimonioId: string, @Body() updateStatusDto: UpdateTestimonioStatusDto) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.updateMyTestimonioStatus(req.user.id, testimonioId, updateStatusDto);
  }
}
