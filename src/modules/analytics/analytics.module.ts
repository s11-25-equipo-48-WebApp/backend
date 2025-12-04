import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { Testimonio } from '../testimonios/entities/testimonio.entity';
import { Organization } from '../organization/entities/organization.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([AnalyticsEvent, Testimonio, Organization]),
    ],
    providers: [AnalyticsService],
    controllers: [AnalyticsController],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
