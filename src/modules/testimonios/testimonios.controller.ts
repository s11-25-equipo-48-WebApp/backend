import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
  UseGuards,
  Delete, // Importar Delete
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
import { TestimoniosService } from './testimonios.service';
import { CreateTestimonioDto } from './dto/create-testimonio.dto';
import type { RequestWithUser } from 'src/common/interfaces/RequestWithUser';
import { UpdateTestimonioDto } from './dto/update-testimonio.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { GetTestimoniosQueryDto } from './dto/get-testimonios-query.dto';
import { JwtAuthGuard } from 'src/jwt/jwt.guard'; // Importar JwtAuthGuard
import { RolesGuard } from 'src/common/guards/roles.guard'; // Importar RolesGuard
import { Roles } from 'src/common/decorators/roles.decorator'; // Importar Roles
import { Role } from 'src/modules/auth/entities/enums'; // Importar Role

@ApiTags('Testimonios')
@Controller('testimonios')
@UseGuards(JwtAuthGuard, RolesGuard) // Aplicar Guards a nivel de controlador
@ApiBearerAuth('access-token') // Decorador para Swagger
export class TestimoniosController {
  constructor(private readonly testimoniosService: TestimoniosService) { }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR) // Solo admins y editores pueden crear
  @HttpCode(HttpStatus.CREATED) // Usar HttpStatus
  @ApiOperation({
    summary: 'Crear testimonio',
    description:
      'Crear un testimonio. El endpoint **no** hace upload de medios; se espera `media_url` como secure URL (Cloudinary/YouTube) provisto por el frontend o un endpoint previo. Si el usuario es ADMIN o SUPERADMIN, el estado será APROBADO automáticamente.',
  })
  @ApiBody({ type: CreateTestimonioDto })
  @ApiCreatedResponse({
    description: 'Testimonio creado',
    schema: {
      example: {
        id: 'uuid-v4',
        title: 'Mi experiencia',
        body: 'Excelente servicio...',
        category_id: 'uuid-category',
        tags: ['uuid-tag-1', 'uuid-tag-2'],
        media_url: 'https://res.cloudinary.com/...',
        media_type: 'image',
        author: 'Juan Perez',
        status: 'pendiente', // O aprobado, según el rol del usuario
        created_at: '2025-11-21T10:00:00.000Z',
      },
    },
  })
  async create(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    createTestimonioDto: CreateTestimonioDto,
    @Req() req: RequestWithUser,
  ) {
    const created = await this.testimoniosService.create(createTestimonioDto, req.user);

    return {
      id: created.id,
      title: created.title,
      body: created.body,
      category_id: created.category.id,
      tags: created.tags,
      media_url: created.media_url,
      media_type: created.media_type,
      author: created.author,
      status: created.status,
      created_at: created.created_at,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR) // Solo admins y editores pueden editar
  @HttpCode(HttpStatus.OK) // Usar HttpStatus
  @ApiOperation({
    summary: 'Editar testimonio',
    description:
      'Editar campos permitidos del testimonio. Solo el autor o admin/superadmin puede editar. Se registra un audit_log con diff antes/después.',
  })
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiBody({ type: UpdateTestimonioDto })
  @ApiOkResponse({
    description: 'Testimonio actualizado',
    schema: {
      example: {
        id: 'uuid-v4',
        title: 'Título actualizado',
        body: 'Contenido corregido',
        category_id: 'uuid-category',
        tags: ['uuid-tag-1', 'uuid-tag-2'],
        media_url: 'https://res.cloudinary.com/mi-cuenta/.../nueva.jpg',
        media_type: 'image',
        author: 'Juan Pérez',
        author_id: 'uuid-user',
        status: 'pendiente',
        created_at: '2025-11-21T10:00:00.000Z',
        updated_at: '2025-11-22T12:00:00.000Z',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTestimonioDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user; // No es necesario || null, el guard ya asegura que user existe
    const updated = await this.testimoniosService.update(id, dto, user);
    return updated;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Solo admins pueden cambiar el estado
  @HttpCode(HttpStatus.OK) // Usar HttpStatus
  @ApiOperation({
    summary: 'Cambiar estado de un testimonio',
    description:
      'Solo admins pueden cambiar estado. Registra approved_by y approved_at. Reglas de transición aplican.',
  })
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiOkResponse({ description: 'Estado actualizado', schema: { example: { id: 'uuid-v4', status: 'aprobado' } } })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    const updated = await this.testimoniosService.updateStatus(id, dto, user);
    return {
      id: updated.id,
      status: updated.status,
      approved_by: updated.approved_by ?? null,
      approved_at: updated.approved_at ?? null,
    };
  }

  @Delete(':id') // Añadir endpoint para soft delete
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Solo admins pueden eliminar
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar testimonio (soft delete)',
    description: 'Marca un testimonio como eliminado lógicamente. Solo administradores pueden realizar esta acción.',
  })
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiOkResponse({ description: 'Testimonio eliminado lógicamente', schema: { example: { id: 'uuid-v4', deleted_at: '2025-11-22T12:00:00.000Z' } } })
  async softDelete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.testimoniosService.softDelete(id, user);
  }

  @Get('public') // Cambiar el endpoint público a una ruta explícita '/public'
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener testimonios públicos',
    description: 'Obtener una lista paginada de testimonios aprobados y públicos, opcionalmente filtrados por categoría, etiqueta y organización.',
  })
  @ApiOkResponse({ description: 'Lista de testimonios públicos' })
  async findPublic(@Query() query: GetTestimoniosQueryDto) {
    return this.testimoniosService.findPublic(query);
  }
}
