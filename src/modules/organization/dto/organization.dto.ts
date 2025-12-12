import { IsString, IsNotEmpty, IsUUID, IsEnum, IsEmail, MaxLength } from 'class-validator';
import { Role } from '../entities/enums';
import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

// DTO para crear organización
export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Mi Organización',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30, { message: 'El nombre no puede tener más de 30 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Descripción de la organización',
    example: 'Descripción breve de mi organización',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

// DTO para actualizar organización
export class UpdateOrganizationDto {
  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Mi Organización Actualizada',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30, { message: 'El nombre no puede tener más de 30 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Descripción de la organización',
    example: 'Nueva descripción breve',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

// DTO para agregar miembro
export class AddOrganizationMemberDto {
  @ApiProperty({
    description: 'Email del miembro a agregar',
    example: 'miembro@example.com',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty()
  email: string;

  @Optional()
  @ApiProperty({
    description: 'Rol del miembro (opcional, por defecto EDITOR)',
    example: Role.EDITOR,
  })
  @IsEnum(Role)
  role: Role;
}

// DTO para actualizar rol de miembro
export class UpdateOrganizationMemberRoleDto {
  @Optional()
  @ApiProperty({
    description: 'Rol del miembro',
    example: Role.EDITOR,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
