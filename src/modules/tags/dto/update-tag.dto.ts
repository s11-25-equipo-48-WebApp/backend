import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'muy-satisfecho', description: 'Nombre nuevo del tag (único)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
