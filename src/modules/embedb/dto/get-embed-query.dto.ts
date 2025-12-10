import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsNumberString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetEmbedQueryDto {
    @ApiProperty({ default: '600', description: 'Ancho del iframe en px.' })
    @IsOptional()
    @IsNumberString()
    width?: string = '600';

    @ApiProperty({ default: '400', description: 'Alto del iframe en px.' })
    @IsOptional()
    @IsNumberString()
    height?: string = '400';

    @ApiProperty({ default: 'light', description: 'Tema del iframe (light o dark).' })
    @IsOptional()
    @IsString()
    @IsIn(['light', 'dark'])
    theme?: 'light' | 'dark' = 'light';

    @ApiProperty({ default: false, description: 'Reproducir el video automáticamente.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    autoplay?: boolean = false;

    @ApiProperty({ default: true, description: 'Mostrar avatar del autor.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    showAvatar?: boolean = true;

    @ApiProperty({ default: true, description: 'Mostrar información del auto/vehículo.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    showVehicle?: boolean = true;

    @ApiProperty({ description: 'ID de la organización para filtrar testimonios.', required: true })
    @IsString()
    organizationId: string;
}

// DTO para cuando organizationId está en la URL (como parámetro)
export class GetEmbedQueryWithoutOrgDto {
    @ApiProperty({ default: '600', description: 'Ancho del iframe en px.' })
    @IsOptional()
    @IsNumberString()
    width?: string = '600';

    @ApiProperty({ default: '400', description: 'Alto del iframe en px.' })
    @IsOptional()
    @IsNumberString()
    height?: string = '400';

    @ApiProperty({ default: 'light', description: 'Tema del iframe (light o dark).' })
    @IsOptional()
    @IsString()
    @IsIn(['light', 'dark'])
    theme?: 'light' | 'dark' = 'light';

    @ApiProperty({ default: false, description: 'Reproducir el video automáticamente.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    autoplay?: boolean = false;

    @ApiProperty({ default: true, description: 'Mostrar avatar del autor.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    showAvatar?: boolean = true;

    @ApiProperty({ default: true, description: 'Mostrar información del auto/vehículo.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    showVehicle?: boolean = true;
}

// DTO para el nuevo endpoint con límite de testimonios
export class GetEmbedWithLimitQueryDto extends GetEmbedQueryWithoutOrgDto {
    @ApiProperty({ 
        default: 5, 
        description: 'Cantidad de testimonios a mostrar (1-20)',
        minimum: 1,
        maximum: 20
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    limit?: number = 5;
}
