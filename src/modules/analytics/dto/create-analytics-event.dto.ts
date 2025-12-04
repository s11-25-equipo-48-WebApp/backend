import { IsEnum, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { EventType } from '../entities/analytics-event.entity';

export class CreateAnalyticsEventDto {
    @IsEnum(EventType)
    event_type: EventType;

    @IsOptional()
    @IsUUID()
    testimonio_id?: string;

    @IsOptional()
    @IsString()
    ip_address?: string;

    @IsOptional()
    @IsString()
    referrer?: string;

    @IsOptional()
    @IsString()
    user_agent?: string;

    @IsOptional()
    @IsObject()
    device_data?: Record<string, any>;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
