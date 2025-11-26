import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from 'src/modules/organization/entities/enums';
//import { Status } from 'src/modules/auth/entities/enums';
/**
 * DTO que recibe el nuevo estado en español según los criterios.
 */
export class UpdateStatusDto {
  @ApiProperty({
    description: 'Nuevo estado (pendiente | aprobado | rechazado)',
    enum: Status,
    example: Status.APROBADO,
  })
  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;
}