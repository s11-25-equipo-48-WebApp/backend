import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'El nombre del tag', example: 'Desarrollo Web' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Una descripción opcional del tag', example: 'Tags relacionados con el desarrollo de sitios y aplicaciones web', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
