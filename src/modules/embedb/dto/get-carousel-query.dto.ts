import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsNumberString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCarouselQueryDto {
    @ApiProperty({ default: '800', description: 'Ancho del carrusel en px.' })
    @IsOptional()
    @IsNumberString()
    width?: string = '800';

    @ApiProperty({ default: '600', description: 'Alto del carrusel en px.' })
    @IsOptional()
    @IsNumberString()
    height?: string = '600';

    @ApiProperty({ default: 'light', description: 'Tema del carrusel (light o dark).' })
    @IsOptional()
    @IsString()
    @IsIn(['light', 'dark'])
    theme?: 'light' | 'dark' = 'light';

    @ApiProperty({ default: true, description: 'Habilitar navegación automática del carrusel.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    autoplay?: boolean = true;

    @ApiProperty({ default: 5000, description: 'Intervalo de autoplay en milisegundos.' })
    @IsOptional()
    @IsNumberString()
    interval?: string = '5000';

    @ApiProperty({ default: 20, description: 'Número de testimonios a mostrar (máximo 50).' })
    @IsOptional()
    @IsNumberString()
    limit?: string = '20';

    @ApiProperty({ description: 'ID de la organización para filtrar testimonios.', required: true })
    @IsString()
    organizationId: string;
}
