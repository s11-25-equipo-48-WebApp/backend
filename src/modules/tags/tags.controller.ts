import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/CreateTagDto';
import { UpdateTagDto } from './dto/UpdateTagDto';
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
  @ApiOkResponse({ type: [Tag] })
  async findAll(@Param('organizationId') organizationId: string, @Req() req) {
    return await this.service.findAll(req.user, organizationId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear tag' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiBody({ type: CreateTagDto })
  @ApiCreatedResponse({ description: 'Tag creado' })
  async create(@Param('organizationId') organizationId: string, @Body() dto: CreateTagDto, @Req() req) {
    return await this.service.create(dto, req.user, organizationId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({ summary: 'Obtener un tag por ID' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag encontrado', type: Tag })
  async findOne(@Param('organizationId') organizationId: string, @Param('id') id: string, @Req() req) {
    return await this.service.findOne(id, req.user, organizationId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar tag' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiBody({ type: UpdateTagDto })
  @ApiOkResponse({ description: 'Tag actualizado' })
  async update(@Param('organizationId') organizationId: string, @Param('id') id: string, @Body() dto: UpdateTagDto, @Req() req) {
    return await this.service.update(id, dto, req.user, organizationId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar tag (remueve relaciones con testimonios)' })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag eliminado' })
  async remove(@Param('organizationId') organizationId: string, @Param('id') id: string, @Req() req) {
    return await this.service.delete(id, req.user, organizationId);
  }
}
