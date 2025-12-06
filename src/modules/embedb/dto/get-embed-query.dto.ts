import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsNumberString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

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
