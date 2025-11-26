import {
  BadRequestException, // Asegurar que BadRequestException esté importado
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
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../organization/entities/enums';

@ApiTags('Testimonios')
@Controller('organizations/:organizationId/testimonios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class TestimoniosController {
  constructor(private readonly testimoniosService: TestimoniosService) { }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear testimonio',
    description:
      'Crear un testimonio. El endpoint **no** hace upload de medios; se espera `media_url` como secure URL (Cloudinary/YouTube) provisto por el frontend o un endpoint previo. Si el usuario es ADMIN o SUPERADMIN, el estado será APROBADO automáticamente.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
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
    @Param('organizationId') organizationId: string, // Obtener organizationId del parámetro de ruta
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    createTestimonioDto: CreateTestimonioDto,
    @Req() req: RequestWithUser,
  ) {
    const created = await this.testimoniosService.create(createTestimonioDto, req.user, organizationId); // Pasar organizationId al servicio

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
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' }) // Añadir Param para organizationId
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
    @Param('organizationId') organizationId: string, // Obtener organizationId del parámetro de ruta
    @Param('id') id: string,
    @Body() dto: UpdateTestimonioDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    const updated = await this.testimoniosService.update(id, dto, user, organizationId); // Pasar organizationId al servicio
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
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' }) // Añadir Param para organizationId
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiOkResponse({ description: 'Estado actualizado', schema: { example: { id: 'uuid-v4', status: 'aprobado' } } })
  async updateStatus(
    @Param('organizationId') organizationId: string, // Obtener organizationId del parámetro de ruta
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    const updated = await this.testimoniosService.updateStatus(id, dto, user, organizationId); // Pasar organizationId al servicio
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
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' }) // Añadir Param para organizationId
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiOkResponse({ description: 'Testimonio eliminado lógicamente', schema: { example: { id: 'uuid-v4', deleted_at: '2025-11-22T12:00:00.000Z' } } })
  async softDelete(
    @Param('organizationId') organizationId: string, // Obtener organizationId del parámetro de ruta
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.testimoniosService.softDelete(id, user, organizationId); // Pasar organizationId al servicio
  }

  @Get('public') // Cambiar el endpoint público a una ruta explícita '/public'
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener testimonios públicos',
    description: 'Obtener una lista paginada de testimonios aprobados y públicos, opcionalmente filtrados por categoría, etiqueta y organización.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' }) // Añadir Param para organizationId
  @ApiOkResponse({ description: 'Lista de testimonios públicos' })
  async findPublic(
    @Param('organizationId') organizationId: string, // Obtener organizationId del parámetro de ruta
    @Query() query: GetTestimoniosQueryDto
  ) {
    // Asegurarse de que el organizationId de la ruta se use para filtrar
    if (!query.organization_id) {
      query.organization_id = organizationId;
    } else if (query.organization_id !== organizationId) {
      throw new BadRequestException('El ID de organización en la ruta y en la consulta no coinciden.');
    }
    return this.testimoniosService.findPublic(query);
  }
}
