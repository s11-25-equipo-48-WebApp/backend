import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinOrganizationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID de la organización a la que el usuario desea unirse' })
  @IsUUID()
  organizationId!: string;
}
