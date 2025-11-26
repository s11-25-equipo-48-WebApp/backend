import { IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTestimoniosQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por category id (uuid)' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tag id (uuid)' })
  @IsOptional()
  @IsUUID()
  tag_id?: string;

  @ApiPropertyOptional({ description: 'Página (paginación)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite por página', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filtrar por ID de organización (uuid)' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;
}
