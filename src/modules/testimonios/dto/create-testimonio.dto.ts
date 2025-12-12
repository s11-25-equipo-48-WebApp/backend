import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryExists } from '../validators/category-exists.validator';
import { TagsExist } from '../validators/tags-exist.validator';
import { StatusS } from '../entities/testimonio.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  NONE = 'none',
}

export class CreateTestimonioDto {
  @ApiProperty({
    description: 'Título del testimonio',
    example: 'Excelente experiencia con soporte',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Cuerpo del testimonio',
    example: 'Me resolvieron rápido y con amabilidad.',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'ID de la categoría (uuid) — debe existir en la DB',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(CategoryExists)
  category_id: string;

  @ApiPropertyOptional({
    description: 'Array de IDs de tags (uuid) — todas deben existir en la DB',
    example: ['aaaaaa11-2222-3333-4444-bbbbbbbbbbbb'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Validate(TagsExist)
  tags?: string[];

  @IsOptional()
  @ApiProperty({
    description: 'Estado del testimonio (pendiente | aprobado | rechazado)',
    enum: StatusS,
    example: StatusS.PENDIENTE,
  })
  status: StatusS;

  @ApiPropertyOptional({
    description:
      'Secure URL del medio (Cloudinary, YouTube, etc). No se hace upload aquí — el frontend ya debe proveerlo.',
    example: 'https://res.cloudinary.com/mi-cuenta/.../imagen.jpg',
  })
  @IsOptional()
  @IsString()
  media_url?: string;

  @ApiProperty({
    description: 'Tipo de medio: image | video | none',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType, { message: 'media_type must be one of: image, video, none' })
  @IsOptional()
  media_type: MediaType;

  @ApiPropertyOptional({
    description: 'Nombre visible del autor del testimonio',
    example: 'María Gómez',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({
    description: 'Correo del cliente',
    example: 'maria.gomez@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}
