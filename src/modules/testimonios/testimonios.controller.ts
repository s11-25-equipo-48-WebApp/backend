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
} from '@nestjs/common';
import {
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

@ApiTags('Testimonios')
@Controller('api/v1/testimonios')
export class TestimoniosController {
  constructor(private readonly testimoniosService: TestimoniosService) { }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Crear testimonio',
    description:
      'Crear un testimonio. El endpoint **no** hace upload de medios; se espera `media_url` como secure URL (Cloudinary/YouTube) provisto por el frontend o un endpoint previo.',
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
        status: 'pending',
        created_at: '2025-11-21T10:00:00.000Z',
      },
    },
  })
  async create(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    createTestimonioDto: CreateTestimonioDto,
  ) {
    const created = await this.testimoniosService.create(createTestimonioDto);

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
  @HttpCode(200)
  @ApiOperation({
    summary: 'Editar testimonio',
    description:
      'Editar campos permitidos del testimonio. Solo el autor o admin puede editar. Se registra un audit_log con diff antes/después.',
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
        status: 'pending',
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
    const user = req.user || null;
    const updated = await this.testimoniosService.update(id, dto, user);
    return updated;
  }

  @Patch(':id/status')
  @HttpCode(200)
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


  @Get()
  async findPublic(@Query() query: GetTestimoniosQueryDto) {
    return this.testimoniosService.findPublic(query);
  }
}
