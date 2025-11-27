import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiProperty({ description: 'El nuevo nombre del tag', example: 'Desarrollo Frontend', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Una nueva descripción opcional para el tag', example: 'Tags para tecnologías de interfaz de usuario', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
