import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'satisfecho', description: 'Nombre único del tag' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

