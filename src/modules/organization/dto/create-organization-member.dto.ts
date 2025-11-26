import { IsEmail, IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/modules/auth/entities/enums';

export class CreateOrganizationMemberDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida' })
  @IsString({ message: 'El email debe ser una cadena de texto' })
  readonly email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario (opcional si el usuario ya existe)',
    example: 'password123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(20, { message: 'La contraseña no debe exceder los 20 caracteres' })
  readonly password?: string;

  @ApiProperty({
    description: 'ID de la organización a la que se asignará el usuario (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El ID de la organización debe ser una cadena de texto' })
  readonly organizationId?: string;

  @ApiProperty({
    description: 'Rol del usuario en la organización (opcional, por defecto EDITOR)',
    enum: Role,
    example: Role.EDITOR,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser un valor válido del enumerado Role' })
  readonly role?: Role;
}
