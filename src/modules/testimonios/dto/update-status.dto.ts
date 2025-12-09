import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusS } from '../entities/testimonio.entity';
//import { Status } from 'src/modules/auth/entities/enums';
/**
 * DTO que recibe el nuevo estado en español según los criterios.
 */
export class UpdateStatusDto {
  @ApiProperty({
    description: 'Nuevo estado (pendiente | aprobado | rechazado)',
    enum: StatusS,
    example: StatusS.APROBADO,
  })
  @IsEnum(StatusS)
  @IsNotEmpty()
  status: StatusS;
}