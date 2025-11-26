import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterUserDto } from 'src/modules/auth/dto/register-user.dto';
import { Role } from 'src/modules/auth/entities/enums';

export class CreateOrganizationMemberDto extends RegisterUserDto {
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
