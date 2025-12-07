import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '../entities/analytics-event.entity';

export class GetAnalyticsQueryDto {
    @ApiProperty({
        description: 'Fecha de inicio para filtrar (ISO 8601)',
        example: '2025-03-28T00:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @ApiProperty({
        description: 'Fecha de fin para filtrar (ISO 8601)',
        example: '2025-04-10T23:59:59Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    end_date?: string;

    @ApiProperty({
        description: 'Tipo de evento para filtrar',
        enum: EventType,
        example: 'view',
        required: false,
    })
    @IsOptional()
    @IsEnum(EventType)
    event_type?: EventType;

    @ApiProperty({
        description: 'Buscar por título del testimonio',
        example: 'excelente',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Número de página',
        example: 1,
        default: 1,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Cantidad de items por página',
        example: 20,
        default: 20,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}
