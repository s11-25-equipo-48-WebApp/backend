import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, UnauthorizedException, Logger, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JoinOrganizationDto } from './dto/join-organization.dto';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { get } from 'http';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) { }

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

  @Put('me/avatar')
  @ApiOperation({ summary: 'Actualizar el avatar del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'El avatar del usuario ha sido actualizado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiBody({ type: UpdateAvatarDto, description: 'Datos del avatar del usuario' })
  async updateAvatar(@Req() req,
    @Body() updateAvatarDto: UpdateAvatarDto) {
    const user = req.user;
    //Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.updateAvatar(req.user.id, updateAvatarDto);
  }

  @Get('me/testimonios')
  @ApiOperation({ summary: 'Obtener todos los testimonios aprobados de la organización al que pertenece el usuario' })
  @ApiResponse({ status: 200, description: 'Lista de testimonios aprobados de la organización al que pertenece el usuario.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado.' })
  async findMyTestimonios(@Req() req) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.findMyTestimonios(req.user.id);
  }

  @Get('me/testimonios/pending')
  @ApiOperation({ summary: 'Obtener todos los testimonios pendientes de aprobación' })
  @ApiResponse({ status: 200, description: 'Lista de testimonios pendientes de aprobación.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado.' })
  async findMyPendingTestimonios(@Req() req) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.findMyPendingTestimonios(req.user.id);
  }

  @Get('me/testimonios/:id')
  @ApiOperation({ summary: 'Obtener un testimonio por su ID' })
  @ApiResponse({ status: 200, description: 'Testimonio encontrado' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado' })
  async findById(
    @Param('id') id: string,
    @Req() req,
  ) {
    const user = req.user;
    Logger.log(`findMyTestimonios: userId: ${user.id}`);
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.findById(id, req.user.id);
  }

  @Delete('me/testimonios/:id')
  @ApiOperation({ summary: 'Eliminar un testimonio del usuario' })
  @ApiResponse({ status: 200, description: 'Testimonio eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado o no autorizado' })
  async remove(
    @Param('id') id: string,
    @Req() req,
  ) {
    const user = req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.userService.removeTestimonio(id, user.id);
  }

}
