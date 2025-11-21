import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
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

@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear categoría', description: 'Crea una nueva categoría. Name debe ser único.' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ description: 'Categoría creada' })
  async create(@Body() dto: CreateCategoryDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (uuid)' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ description: 'Categoría actualizada' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar categoría', description: 'Si hay testimonios asociados, pasar reassign_to en query para reasignarlos antes de borrar.' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (uuid)' })
  @ApiQuery({ name: 'reassign_to', required: false, description: 'ID de categoría destino para reasignar testimonios antes de eliminar' })
  @ApiOkResponse({ description: 'Categoría eliminada' })
  async remove(@Param('id') id: string, @Query('reassign_to') reassign_to?: string) {
    return await this.service.delete(id, reassign_to);
  }
}
