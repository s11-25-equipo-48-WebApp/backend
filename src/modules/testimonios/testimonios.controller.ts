import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
  UseGuards,
  Delete,
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
        author_name: 'Juan Perez',
        author_email: 'juan@example.com',
        status: 'pendiente',
        created_at: '2025-11-21T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async create(
    @Param('organizationId') organizationId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    createTestimonioDto: CreateTestimonioDto,
    @Req() req: RequestWithUser,
  ) {
    const created = await this.testimoniosService.create(createTestimonioDto, req.user, organizationId);

    return {
      id: created.id,
      title: created.title,
      body: created.body,
      category_id: created.category.id,
      tags: created.tags,
      media_url: created.media_url,
      media_type: created.media_type,
      author_name: created.author_name,
      author_email: created.author_email,
      status: 'pendiente',
      created_at: created.created_at,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Editar testimonio',
    description:
      'Editar campos permitidos del testimonio. Solo administradores y superadministradores pueden editar. Se registra un audit_log con diff antes/después.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
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
        author_name: 'Juan Pérez',
        author_email: 'juan@example.com',
        status: 'pendiente',
        created_at: '2025-11-21T10:00:00.000Z',
        updated_at: '2025-11-22T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado' })
  async update(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTestimonioDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    const updated = await this.testimoniosService.update(id, dto, user, organizationId);
    return updated;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Cambiar estado de un testimonio',
    description:
      'Solo admins y superadmins pueden cambiar estado. Registra approved_by y approved_at. Reglas de transición aplican.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiOkResponse({
    description: 'Estado actualizado',
    schema: {
      example: {
        id: 'uuid-v4',
        status: 'aprobado',
        approved_by: 'uuid-admin',
        approved_at: '2025-11-22T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o transición no permitida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado' })
  async updateStatus(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    const updated = await this.testimoniosService.updateStatus(id, dto, user, organizationId);
    return {
      id: updated.id,
      status: updated.status,
      approved_by: updated.approved_by ?? null,
      approved_at: updated.approved_at ?? null,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Eliminar testimonio (soft delete)',
    description: 'Marca un testimonio como eliminado lógicamente. Solo administradores y superadministradores pueden realizar esta acción.', // ✅ CAMBIO
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiOkResponse({
    description: 'Testimonio eliminado lógicamente',
    schema: {
      example: {
        id: 'uuid-v4',
        deleted_at: '2025-11-22T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado' })
  async softDelete(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    return this.testimoniosService.softDelete(id, user, organizationId);
  }
  
  @Get('public')
  @ApiOperation({
    summary: 'Obtener testimonios públicos',
    description: 'Obtener una lista paginada de testimonios aprobados, opcionalmente filtrados por categoría, etiqueta y organización.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Lista de testimonios públicos' })
  @ApiOkResponse({ description: 'Lista de testimonios públicos' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async findPublic(
    @Param('organizationId') organizationId: string,
    @Query() query: GetTestimoniosQueryDto
  ) {
    if (!query.organization_id) {
      query.organization_id = organizationId;
    } else if (query.organization_id !== organizationId) {
      throw new BadRequestException('El ID de organización en la ruta y en la consulta no coinciden.');
    }
    return this.testimoniosService.findPublic(query);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener testimonios pendientes',
    description: 'Obtener una lista paginada de testimonios con estado PENDIENTE. Solo accesible para administradores y superadministradores de la organización.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiOkResponse({ description: 'Lista de testimonios pendientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async findPending(
    @Param('organizationId') organizationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.testimoniosService.findPending(organizationId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener testimonio por ID',
    description: 'Obtener un testimonio por su ID dentro de la organización especificada.',
  })
  @ApiParam({ name: 'organizationId', description: 'ID de la organización (uuid)' })
  @ApiParam({ name: 'id', description: 'ID del testimonio (uuid)' })
  @ApiOkResponse({ description: 'Testimonio' })
  @ApiOkResponse({ description: 'Testimonio encontrado' })
  @ApiResponse({ status: 404, description: 'Testimonio no encontrado' })
  async findById(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.testimoniosService.findById(id, organizationId);
  }
}