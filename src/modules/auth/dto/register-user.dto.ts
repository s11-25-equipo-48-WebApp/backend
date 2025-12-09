import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario (nombre y apellido)',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  readonly fullName?: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida' })
  readonly email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres, letras y números)',
    example: 'abc123',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(20, { message: 'La contraseña no debe exceder los 20 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
    message: 'La contraseña debe incluir letras y números',
  })
  readonly password!: string;
}
