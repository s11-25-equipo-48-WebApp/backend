import {
  IsArray,
  IsOptional,
  IsString,
  Validate,
  ArrayUnique,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryExists } from '../validators/category-exists.validator';
import { TagsExist } from '../validators/tags-exist.validator';

export class UpdateTestimonioDto {
  @ApiPropertyOptional({ description: 'Título', example: 'Nuevo título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Cuerpo', example: 'Texto actualizado' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'ID de categoría (uuid) — debe existir',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @IsOptional()
  @IsString()
  @Validate(CategoryExists)
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Array de IDs de tags (uuid) — todas deben existir',
    type: [String],
    example: ['aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Validate(TagsExist)
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Secure URL del medio (Cloudinary/YouTube). No upload aquí.',
    example: 'https://res.cloudinary.com/.../nuevo.jpg',
  })
  @IsOptional()
  @IsString()
  media_url?: string;
}
