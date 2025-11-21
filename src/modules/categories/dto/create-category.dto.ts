import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Soporte', description: 'Nombre único de la categoría' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
