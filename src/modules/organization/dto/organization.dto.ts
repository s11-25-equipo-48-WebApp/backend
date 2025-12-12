import { IsString, IsNotEmpty, IsUUID, IsEnum, IsEmail } from 'class-validator';
import { Role } from '../entities/enums';
import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class AddOrganizationMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Optional()

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

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
