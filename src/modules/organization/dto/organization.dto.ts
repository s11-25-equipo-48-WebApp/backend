import { IsString, IsNotEmpty, IsUUID, IsEnum, IsEmail } from 'class-validator';
import { Role } from '../entities/enums';

export class CreateOrganizationDto {
  @ApiProperty({ 
    example: 'Organización de prueba', 
    description: 'Nombre de la organización', 
    required: true 
  })
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
}

export class UpdateOrganizationMemberRoleDto {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
function ApiProperty(arg0: { example: string; description: string; required: boolean; }): (target: CreateOrganizationDto, propertyKey: "name") => void {
  throw new Error('Function not implemented.');
}

