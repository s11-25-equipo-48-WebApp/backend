import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from 'src/modules/organization/entities/enums';

export class UpdateTestimonioStatusDto {
  @ApiProperty({ enum: Status, example: Status.PENDIENTE, description: 'Nuevo estado del testimonio (pendiente, aprobado, rechazado)' })
  @IsEnum(Status)
  status!: Status;
}
