import { IsEnum, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '../entities/analytics-event.entity';

export class CreateAnalyticsEventDto {
    @ApiProperty({
        description: 'Tipo de evento a registrar',
        enum: EventType,
        example: 'view',
        required: true,
    })
    @IsEnum(EventType)
    event_type: EventType;

    @ApiProperty({
        description: 'ID del testimonio relacionado (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174001',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    testimonio_id?: string;

    @ApiProperty({
        description: 'Dirección IP del usuario',
        example: '192.168.1.1',
        required: false,
    })
    @IsOptional()
    @IsString()
    ip_address?: string;

    @ApiProperty({
        description: 'URL de referencia (de dónde vino el usuario)',
        example: 'https://google.com/q=excelente',
        required: false,
    })
    @IsOptional()
    @IsString()
    referrer?: string;

    @ApiProperty({
        description: 'User agent del navegador',
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        required: false,
    })
    @IsOptional()
    @IsString()
    user_agent?: string;

    @ApiProperty({
        description: 'Datos del dispositivo (objeto JSON)',
        example: {
            browser: 'Chrome',
            os: 'Windows',
            screen_width: 1920,
            screen_height: 1080,
        },
        required: false,
    })
    @IsOptional()
    @IsObject()
    device_data?: Record<string, any>;

    @ApiProperty({
        description: 'Metadata adicional del evento (objeto JSON)',
        example: {
            consent_type: 'privacy_policy',
            timestamp: '2025-12-04T17:30:00Z',
        },
        required: false,
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
