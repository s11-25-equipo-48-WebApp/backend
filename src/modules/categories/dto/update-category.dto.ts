import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Soporte Técnico', description: 'Nombre nuevo de la categoría (único)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
