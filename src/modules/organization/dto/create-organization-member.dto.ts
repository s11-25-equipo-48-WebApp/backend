import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
//import { IsEitherDefined } from '../../common/decorators/is-either-defined.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/enums';
import { IsEitherDefined } from 'src/common/decorators/is-either-defined.decorator';

export class CreateOrganizationMemberDto {
  @ApiProperty({
    description: 'ID del usuario existente',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
  @ValidateIf(o => !o.email)
  readonly userId?: string;

  @ApiProperty({
    description: 'Email del usuario para registrar o agregar si existe',
    example: 'nuevo.miembro@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida' })
  @IsString({ message: 'El email debe ser una cadena de texto' })
  @ValidateIf(o => !o.userId)
  readonly email?: string;

  @IsEitherDefined('userId', 'email', { message: 'Debe proporcionar un userId o un email' })
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
