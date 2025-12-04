import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { Testimonio } from '../testimonios/entities/testimonio.entity';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { AnalyticsMetricsDto } from './dto/analytics-metrics.dto';
import { AnalyticsEventResponseDto } from './dto/analytics-event-response.dto';
import { AnalyticsEventDetailDto } from './dto/analytics-event-detail.dto';
import { Status } from '../organization/entities/enums';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(AnalyticsEvent)
        private readonly analyticsRepo: Repository<AnalyticsEvent>,
        @InjectRepository(Testimonio)
        private readonly testimonioRepo: Repository<Testimonio>,
    ) { }

    /**
     * Crea un nuevo evento de analítica.
     * @param dto Datos del evento
     * @param organizationId ID de la organización
     * @param userId ID del usuario (opcional)
     * @returns El evento creado
     */
    async trackEvent(
        dto: CreateAnalyticsEventDto,
        organizationId: string,
        userId?: string,
    ): Promise<AnalyticsEvent> {
        // Validar que el testimonio existe si se proporciona
        if (dto.testimonio_id) {
            const testimonio = await this.testimonioRepo.findOne({
                where: { id: dto.testimonio_id },
            });
            if (!testimonio) {
                throw new NotFoundException(
                    `Testimonio con ID ${dto.testimonio_id} no encontrado`,
                );
            }
        }

        const event = this.analyticsRepo.create({
            id: uuidv4(),
            event_type: dto.event_type,
            testimonio_id: dto.testimonio_id,
            organization_id: organizationId,
            user_id: userId,
            ip_address: dto.ip_address,
            referrer: dto.referrer,
            user_agent: dto.user_agent,
            device_data: dto.device_data,
            metadata: dto.metadata,
        });

        return await this.analyticsRepo.save(event);
    }

    /**
     * Obtiene las métricas del dashboard para una organización.
     * @param organizationId ID de la organización
     * @param startDate Fecha de inicio (opcional)
     * @param endDate Fecha de fin (opcional)
     * @returns Métricas calculadas
     */
    async getMetrics(
        organizationId: string,
        startDate?: Date,
        endDate?: Date,
    ): Promise<AnalyticsMetricsDto> {
        // Construir filtro de fecha
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.created_at = Between(
                startDate || new Date('1970-01-01'),
                endDate || new Date(),
            );
        }

        // Testimonios publicados (aprobados)
        const testimoniosPublicados = await this.testimonioRepo.count({
            where: {
                organization: { id: organizationId },
                status: Status.APROBADO,
                deleted_at: null,
                ...dateFilter,
            },
        });

        // Testimonios recibidos (total)
        const testimoniosRecibidos = await this.testimonioRepo.count({
            where: {
                organization: { id: organizationId },
                deleted_at: null,
                ...dateFilter,
            },
        });

        // Testimonios rechazados
        const testimoniosRechazados = await this.testimonioRepo.count({
            where: {
                organization: { id: organizationId },
                status: Status.RECHAZADO,
                deleted_at: null,
                ...dateFilter,
            },
        });

        // Calcular tasa de aprobación
        const tasaAprobacion =
            testimoniosRecibidos > 0
                ? Math.round((testimoniosPublicados / testimoniosRecibidos) * 100)
                : 0;

        // Contar eventos de consentimiento
        const eventFilter: any = {
            organization_id: organizationId,
        };
        if (startDate || endDate) {
            eventFilter.created_at = Between(
                startDate || new Date('1970-01-01'),
                endDate || new Date(),
            );
        }

        const consentGiven = await this.analyticsRepo.count({
            where: {
                ...eventFilter,
                event_type: 'consent_given',
            },
        });

        const consentRevoked = await this.analyticsRepo.count({
            where: {
                ...eventFilter,
                event_type: 'consent_revoked',
            },
        });

        // Calcular tasa de consentimiento
        const totalConsentEvents = consentGiven + consentRevoked;
        const tasaConsentimiento =
            totalConsentEvents > 0
                ? Math.round((consentGiven / totalConsentEvents) * 100)
                : 0;

        // Visualizaciones
        const visualizaciones = await this.analyticsRepo.count({
            where: {
                ...eventFilter,
                event_type: 'view',
            },
        });

        return {
            testimonios_publicados: testimoniosPublicados,
            testimonios_recibidos: testimoniosRecibidos,
            tasa_aprobacion: tasaAprobacion,
            tasa_consentimiento: tasaConsentimiento,
            visualizaciones: visualizaciones,
        };
    }

    /**
     * Obtiene una lista de eventos con filtros y paginación.
     * @param organizationId ID de la organización
     * @param query Parámetros de consulta
     * @returns Lista paginada de eventos
     */
    async getEvents(
        organizationId: string,
        query: GetAnalyticsQueryDto,
    ): Promise<{
        data: AnalyticsEventResponseDto[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        const { start_date, end_date, event_type, search, page = 1, limit = 20 } = query;

        // Construir filtros
        const where: any = {
            organization_id: organizationId,
        };

        if (start_date || end_date) {
            where.created_at = Between(
                start_date ? new Date(start_date) : new Date('1970-01-01'),
                end_date ? new Date(end_date) : new Date(),
            );
        }

        if (event_type) {
            where.event_type = event_type;
        }

        // Query builder para búsqueda por título de testimonio
        const queryBuilder = this.analyticsRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.testimonio', 'testimonio')
            .where('event.organization_id = :organizationId', { organizationId });

        if (start_date || end_date) {
            queryBuilder.andWhere('event.created_at BETWEEN :startDate AND :endDate', {
                startDate: start_date ? new Date(start_date) : new Date('1970-01-01'),
                endDate: end_date ? new Date(end_date) : new Date(),
            });
        }

        if (event_type) {
            queryBuilder.andWhere('event.event_type = :eventType', { event_type });
        }

        if (search) {
            queryBuilder.andWhere('testimonio.title ILIKE :search', {
                search: `%${search}%`,
            });
        }

        // Paginación
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit).orderBy('event.created_at', 'DESC');

        const [events, total] = await queryBuilder.getManyAndCount();

        // Mapear a DTO de respuesta
        const data: AnalyticsEventResponseDto[] = events.map((event) => ({
            id: event.id,
            testimonio: event.testimonio?.title || 'N/A',
            tipo_evento: event.event_type,
            fecha_hora: event.created_at,
            ip: event.ip_address || 'N/A',
            referrer: event.referrer || 'N/A',
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Obtiene los detalles de un evento específico.
     * @param eventId ID del evento
     * @param organizationId ID de la organización
     * @returns Detalles del evento
     */
    async getEventDetails(
        eventId: string,
        organizationId: string,
    ): Promise<AnalyticsEventDetailDto> {
        const event = await this.analyticsRepo.findOne({
            where: { id: eventId },
            relations: ['testimonio'],
        });

        if (!event) {
            throw new NotFoundException(`Evento con ID ${eventId} no encontrado`);
        }

        // Verificar que el evento pertenece a la organización
        if (event.organization_id !== organizationId) {
            throw new ForbiddenException(
                'No tienes permiso para ver este evento',
            );
        }

        return {
            titulo_testimonio: event.testimonio?.title || 'N/A',
            tipo_evento: event.event_type,
            fecha_hora: event.created_at,
            ip: event.ip_address || 'N/A',
            referrer: event.referrer || 'N/A',
            datos_dispositivo: event.device_data
                ? JSON.stringify(event.device_data, null, 2)
                : 'N/A',
            user_agent: event.user_agent || 'N/A',
        };
    }
}
