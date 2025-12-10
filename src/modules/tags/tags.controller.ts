import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/CreateTagDto';
import { UpdateTagDto } from './dto/UpdateTagDto';
import { GetTagsQueryDto } from './dto/GetTagsQueryDto';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Tag } from './entities/tag.entity';
import { Role } from '../organization/entities/enums';


@ApiTags('Tags')
@Controller('organizations/:organizationId/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class TagsController {
  constructor(private readonly service: TagsService) {}


  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: 'Listar tags' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Listado de tags', type: [Tag] })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async findAll(
    @Param('organizationId') organizationId: string,
    @Req() req,
    @Query() query: GetTagsQueryDto,
  ) {
    return await this.service.findAll(req.user, organizationId, query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Crear tag' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiBody({ type: CreateTagDto })
  @ApiCreatedResponse({ description: 'Tag creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o tag duplicado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async create(@Param('organizationId') organizationId: string, @Body() dto: CreateTagDto, @Req() req) {
    return await this.service.create(dto, req.user, organizationId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: 'Obtener un tag por ID' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag encontrado', type: Tag })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tag no encontrado' })
  async findOne(@Param('organizationId') organizationId: string, @Param('id') id: string, @Req() req) {
    return await this.service.findOne(id, req.user, organizationId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Actualizar tag' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiBody({ type: UpdateTagDto })
  @ApiOkResponse({ description: 'Tag actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o name duplicado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tag no encontrado' })
  async update(@Param('organizationId') organizationId: string, @Param('id') id: string, @Body() dto: UpdateTagDto, @Req() req) {
    return await this.service.update(id, dto, req.user, organizationId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar tag (remueve relaciones con testimonios)' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tag no encontrado' })
  async remove(@Param('organizationId') organizationId: string, @Param('id') id: string, @Req() req) {
    return await this.service.delete(id, req.user, organizationId);
  }
}
