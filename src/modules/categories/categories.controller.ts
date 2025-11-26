import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity'; // Cambiar a import normal para que pueda ser usado como valor en @ApiOkResponse
import { JwtAuthGuard } from 'src/jwt/jwt.guard'; // Importar JwtAuthGuard
import { RolesGuard } from 'src/common/guards/roles.guard'; // Importar RolesGuard
import { Roles } from 'src/common/decorators/roles.decorator'; // Importar Roles
import { Role } from 'src/modules/auth/entities/enums'; // Importar Role
import { RequestWithUser } from 'src/common/interfaces/RequestWithUser'; // Importar RequestWithUser


@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard) // Aplicar Guards a nivel de controlador
@ApiBearerAuth('access-token') // Decorador para Swagger
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR) // Todos pueden listar
  @ApiOperation({ summary: 'Listar categorías' })
  @ApiOkResponse({ type: Category }) // Esto ahora es válido
  async findAll(@Req() req) {
    return await this.service.findAll(req.user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR) // Solo admins y editores pueden crear
  @HttpCode(HttpStatus.CREATED) // Usar HttpStatus
  @ApiOperation({ summary: 'Crear categoría', description: 'Crea una nueva categoría. Name debe ser único dentro de la organización.' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Categoría creada' })
  async create(@Body() dto: CreateCategoryDto, @Req() req) {
    const created = await this.service.create(dto, req.user);
    return created;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR) // Solo admins y editores pueden actualizar
  @HttpCode(HttpStatus.OK) // Usar HttpStatus
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (uuid)' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Categoría actualizada' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Req() req) {
    return await this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Solo admins pueden eliminar
  @HttpCode(HttpStatus.OK) // Usar HttpStatus
  @ApiOperation({ summary: 'Eliminar categoría', description: 'Si hay testimonios asociados, pasar reassign_to en query para reasignarlos antes de borrar. La categoría debe pertenecer a la organización del usuario.' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (uuid)' })
  @ApiQuery({ name: 'reassign_to', required: false, description: 'ID de categoría destino para reasignar testimonios antes de eliminar' })
  @ApiOkResponse({ description: 'Categoría eliminada' })
  async remove(@Param('id') id: string, @Req() req, @Query('reassign_to') reassign_to?: string) {
    return await this.service.delete(id, req.user, reassign_to);
  }
}
