import { IsString, IsNotEmpty, IsUUID, IsEnum, IsEmail } from 'class-validator';
import { Role } from '../entities/enums';

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

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class UpdateOrganizationMemberRoleDto {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
