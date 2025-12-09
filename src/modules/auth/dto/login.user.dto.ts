import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
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
