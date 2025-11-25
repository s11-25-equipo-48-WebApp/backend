import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
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

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}


  @Get()
  @ApiOperation({ summary: 'Listar tags' })
  @ApiOkResponse({ type: [String] })
  async findAll() {
    return await this.service.findAll();
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear tag' })
  @ApiBody({ type: CreateTagDto })
  @ApiCreatedResponse({ description: 'Tag creado' })
  async create(@Body() dto: CreateTagDto) {
    return await this.service.create(dto);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Actualizar tag' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiBody({ type: UpdateTagDto })
  @ApiOkResponse({ description: 'Tag actualizado' })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar tag (remueve relaciones con testimonios)' })
  @ApiParam({ name: 'id', description: 'ID del tag (uuid)' })
  @ApiOkResponse({ description: 'Tag eliminado' })
  async remove(@Param('id') id: string) {
    return await this.service.delete(id);
  }
}
