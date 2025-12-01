import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John', description: 'Nombre del usuario (opcional)', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Apellido del usuario (opcional)', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Correo electrónico del usuario (opcional)', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Puedes añadir más campos que un usuario pueda actualizar
}
