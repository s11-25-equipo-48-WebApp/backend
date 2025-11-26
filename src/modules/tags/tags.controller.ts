import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req, // Importar Req
  UseGuards, // Importar UseGuards
  HttpStatus, // Importar HttpStatus
} from '@nestjs/common';
import {
  ApiBearerAuth, // Importar ApiBearerAuth
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
import { JwtAuthGuard } from 'src/jwt/jwt.guard'; // Importar JwtAuthGuard
import { RolesGuard } from 'src/common/guards/roles.guard'; // Importar RolesGuard
import { Roles } from 'src/common/decorators/roles.decorator'; // Importar Roles
import { Role } from 'src/modules/auth/entities/enums'; // Importar Role
import { RequestWithUser } from 'src/common/interfaces/RequestWithUser'; // Importar RequestWithUser
import { Tag } from './entities/tag.entity'; // Importar Tag (cambiar a import normal)


@ApiTags('Tags')
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard) // Aplicar Guards a nivel de controlador
@ApiBearerAuth('access-token') // Decorador para Swagger
export class TagsController {
  constructor(private readonly service: TagsService) {}


  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR) // Todos pueden listar
  @ApiOperation({ summary: 'Listar tags' })
  @ApiOkResponse({ type: [Tag] }) // Esto ahora es válido
  async findAll(@Req() req) {
    return await this.service.findAll(req.user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR) // Solo admins y editores pueden crear
  @HttpCode(HttpStatus.CREATED) // Usar HttpStatus
  @ApiOperation({ summary: 'Crear tag' })
  @ApiBody({ type: CreateTagDto })
  @ApiCreatedResponse({ description: 'Tag creado' })
  async create(@Body() dto: CreateTagDto, @Req() req) {
    return await this.service.create(dto, req.user);
  }

  @Get(':id') // Añadir endpoint para obtener un tag por ID
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR) // Todos pueden ver un tag
  @ApiOperation({ summary: 'Obtener un tag por ID' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag encontrado', type: Tag })
  async findOne(@Param('id') id: string, @Req() req) {
    return await this.service.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR) // Solo admins y editores pueden actualizar
  @HttpCode(HttpStatus.OK) // Usar HttpStatus
  @ApiOperation({ summary: 'Actualizar tag' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiBody({ type: UpdateTagDto })
  @ApiOkResponse({ description: 'Tag actualizado' })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto, @Req() req) {
    return await this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Solo admins pueden eliminar
  @HttpCode(HttpStatus.OK) // Usar HttpStatus
  @ApiOperation({ summary: 'Eliminar tag (remueve relaciones con testimonios)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag eliminado' })
  async remove(@Param('id') id: string, @Req() req) {
    return await this.service.delete(id, req.user);
  }
}
