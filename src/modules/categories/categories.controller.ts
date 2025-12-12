import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  ApiQuery,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../organization/entities/enums';

@ApiTags('Categories')
@Controller('organizations/:organizationId/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  // --------------------------------------------------------
  // GET ALL
  // --------------------------------------------------------
  @Get()
  //@Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR, Role.VISITOR)
  @ApiOperation({
    summary: 'Listar categorías',
    description:
      'Retorna todas las categorías de la organización con el conteo de testimonios asociados',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID de la organización (uuid)',
  })
  @ApiOkResponse({
    description: 'Lista de categorías con conteo de uso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          usage_count: {
            type: 'number',
            description: 'Cantidad de testimonios usando esta categoría',
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async findAll(@Param('organizationId') organizationId: string, @Req() req) {
    return await this.service.findAll(req.user, organizationId);
  }

  // --------------------------------------------------------
  // CREATE
  // --------------------------------------------------------
  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Crear categoría',
    description:
      'Crea una nueva categoría. Name debe ser único dentro de la organización.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID de la organización (uuid)',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Categoría creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o duplicados' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateCategoryDto,
    @Req() req,
  ) {
    return await this.service.create(dto, req.user, organizationId);
  }

  // --------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({
    name: 'organizationId',
    description: 'ID de la organización (uuid)',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría (uuid)' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Categoría actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async update(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req,
  ) {
    return await this.service.update(id, dto, req.user, organizationId);
  }

  // --------------------------------------------------------
  // DELETE
  // --------------------------------------------------------
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Eliminar categoría',
    description:
      'Si hay testimonios asociados, pasar reassign_to en query para reasignarlos antes de borrar.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID de la organización (uuid)',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría (uuid)' })
  @ApiQuery({
    name: 'reassign_to',
    required: false,
    description:
      'ID de categoría destino para reasignar testimonios antes de eliminar',
  })
  @ApiOkResponse({ description: 'Categoría eliminada' })
  @ApiResponse({
    status: 400,
    description: 'La categoría tiene dependencias sin reasignar',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async remove(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Req() req,
    @Query('reassign_to') reassign_to?: string,
  ) {
    return await this.service.delete(
      id,
      req.user,
      organizationId,
      reassign_to,
    );
  }
}
