import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    ValidationPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiBody,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../organization/entities/enums';
import type { RequestWithUser } from 'src/common/interfaces/RequestWithUser';

@ApiTags('Analytics')
@Controller('organizations/:organizationId/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * POST /organizations/:organizationId/analytics/events
     * Registra un evento de analítica.
     * 
     * IMPORTANTE: Este endpoint es llamado por el FRONTEND cuando ocurren eventos importantes:
     * - Cuando alguien visualiza un testimonio (event_type: 'view')
     * - Cuando se envía un nuevo testimonio (event_type: 'submission')
     * - Cuando se aprueba un testimonio (event_type: 'approval')
     * - Cuando se rechaza un testimonio (event_type: 'rejection')
     * - Cuando se da consentimiento (event_type: 'consent_given')
     * - Cuando se revoca consentimiento (event_type: 'consent_revoked')
     * 
     * NO requiere autenticación para permitir tracking público.
     */
    @Post('events')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Registrar evento de analítica',
        description: `
**Uso:** El frontend llama este endpoint para registrar eventos importantes.

**Ejemplos de uso:**
- Cuando un usuario **ve** un testimonio en la página pública
- Cuando alguien **envía** un nuevo testimonio
- Cuando un admin **aprueba** o **rechaza** un testimonio
- Cuando un usuario **da consentimiento** para usar su testimonio

**Nota:** Este endpoint NO requiere autenticación. Si el usuario está autenticado, 
el backend automáticamente guardará su user_id.

**Tipos de eventos disponibles:**
- \`view\`: Visualización de un testimonio
- \`submission\`: Envío de un nuevo testimonio
- \`approval\`: Aprobación de un testimonio
- \`rejection\`: Rechazo de un testimonio
- \`consent_given\`: Consentimiento otorgado
- \`consent_revoked\`: Consentimiento revocado
    `,
    })
    @ApiParam({
        name: 'organizationId',
        description: 'ID de la organización (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiBody({
        type: CreateAnalyticsEventDto,
        description: 'Datos del evento a registrar',
        examples: {
            view_event: {
                summary: 'Ejemplo: Registrar visualización',
                value: {
                    event_type: 'view',
                    testimonio_id: '123e4567-e89b-12d3-a456-426614174001',
                    ip_address: '192.168.1.1',
                    referrer: 'https://google.com/q=excelente',
                    user_agent:
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    device_data: {
                        browser: 'Chrome',
                        os: 'Windows',
                        screen_width: 1920,
                        screen_height: 1080,
                    },
                },
            },
            submission_event: {
                summary: 'Ejemplo: Registrar envío de testimonio',
                value: {
                    event_type: 'submission',
                    testimonio_id: '123e4567-e89b-12d3-a456-426614174002',
                    ip_address: '203.0.113.1',
                    referrer: 'https://facebook.com',
                    user_agent:
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
                },
            },
            consent_event: {
                summary: 'Ejemplo: Registrar consentimiento',
                value: {
                    event_type: 'consent_given',
                    testimonio_id: '123e4567-e89b-12d3-a456-426614174003',
                    ip_address: '172.16.0.1',
                    metadata: {
                        consent_type: 'privacy_policy',
                        timestamp: '2025-12-04T17:30:00Z',
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Evento registrado exitosamente',
        schema: {
            example: {
                id: '123e4567-e89b-12d3-a456-426614174999',
                event_type: 'view',
                testimonio_id: '123e4567-e89b-12d3-a456-426614174001',
                organization_id: '123e4567-e89b-12d3-a456-426614174000',
                ip_address: '192.168.1.1',
                referrer: 'https://google.com/q=excelente',
                created_at: '2025-12-04T17:30:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: 404,
        description:
            'Testimonio no encontrado (si se proporciona testimonio_id inválido)',
    })
    async trackEvent(
        @Param('organizationId') organizationId: string,
        @Body(new ValidationPipe({ whitelist: true, transform: true }))
        dto: CreateAnalyticsEventDto,
        @Req() req?: RequestWithUser,
    ) {
        const userId = req?.user?.id;
        return await this.analyticsService.trackEvent(dto, organizationId, userId);
    }

    /**
     * GET /organizations/:organizationId/analytics/metrics
     * Obtiene las métricas del dashboard de analítica.
     * 
     * Requiere autenticación y ser miembro de la organización (ADMIN o EDITOR).
     */
    @Get('metrics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.EDITOR)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Obtener métricas del dashboard',
        description: `
**Uso:** El frontend llama este endpoint para mostrar las métricas en el dashboard de analítica.

**Retorna:**
- \`testimonios_publicados\`: Cantidad de testimonios aprobados
- \`testimonios_recibidos\`: Cantidad total de testimonios
- \`tasa_aprobacion\`: Porcentaje de aprobación (aprobados/total * 100)
- \`tasa_consentimiento\`: Porcentaje de consentimiento (consent_given/total_consent * 100)
- \`visualizaciones\`: Cantidad de eventos tipo 'view'

**Filtros opcionales:**
- Puedes filtrar por rango de fechas usando \`start_date\` y \`end_date\`
    `,
    })
    @ApiParam({
        name: 'organizationId',
        description: 'ID de la organización (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({
        name: 'start_date',
        required: false,
        description: 'Fecha de inicio para filtrar métricas (ISO 8601)',
        example: '2025-03-28T00:00:00Z',
    })
    @ApiQuery({
        name: 'end_date',
        required: false,
        description: 'Fecha de fin para filtrar métricas (ISO 8601)',
        example: '2025-04-10T23:59:59Z',
    })
    @ApiResponse({
        status: 200,
        description: 'Métricas calculadas exitosamente',
        schema: {
            example: {
                testimonios_publicados: 20,
                testimonios_recibidos: 35,
                tasa_aprobacion: 94,
                tasa_consentimiento: 98,
                visualizaciones: 100,
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    @ApiResponse({
        status: 403,
        description: 'No tiene permisos (requiere rol ADMIN o EDITOR)',
    })
    async getMetrics(
        @Param('organizationId') organizationId: string,
        @Query('start_date') startDate?: string,
        @Query('end_date') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.analyticsService.getMetrics(organizationId, start, end);
    }

    /**
     * GET /organizations/:organizationId/analytics/events
     * Obtiene una lista de eventos con filtros y paginación.
     * 
     * Requiere autenticación y rol de ADMIN.
     */
    @Get('events')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Listar eventos de analítica (con filtros y paginación)',
        description: `
**Uso:** El frontend llama este endpoint para mostrar la tabla de eventos en el dashboard.

**Filtros disponibles:**
- \`start_date\` y \`end_date\`: Filtrar por rango de fechas
- \`event_type\`: Filtrar por tipo de evento (view, submission, approval, etc.)
- \`search\`: Buscar por título del testimonio
- \`page\` y \`limit\`: Paginación

**Retorna:**
- Lista de eventos con información básica (id, testimonio, tipo, fecha, IP, referrer)
- Metadata de paginación (total, página actual, total de páginas)

**Nota:** Solo administradores pueden ver la lista completa de eventos.
    `,
    })
    @ApiParam({
        name: 'organizationId',
        description: 'ID de la organización (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({
        name: 'start_date',
        required: false,
        description: 'Fecha de inicio (ISO 8601)',
        example: '2025-03-28T00:00:00Z',
    })
    @ApiQuery({
        name: 'end_date',
        required: false,
        description: 'Fecha de fin (ISO 8601)',
        example: '2025-04-10T23:59:59Z',
    })
    @ApiQuery({
        name: 'event_type',
        required: false,
        description: 'Filtrar por tipo de evento',
        enum: [
            'view',
            'submission',
            'approval',
            'rejection',
            'consent_given',
            'consent_revoked',
        ],
        example: 'view',
    })
    @ApiQuery({
        name: 'search',
        required: false,
        description: 'Buscar por título del testimonio',
        example: 'excelente',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Número de página',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Cantidad de items por página',
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de eventos obtenida exitosamente',
        schema: {
            example: {
                data: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174999',
                        testimonio: 'Excelente servicio',
                        tipo_evento: 'view',
                        fecha_hora: '2025-04-30T15:30:22.000Z',
                        ip: '203.0.113.1',
                        referrer: 'google.com/q=excelente',
                    },
                    {
                        id: '123e4567-e89b-12d3-a456-426614174998',
                        testimonio: 'Muy recomendado',
                        tipo_evento: 'submission',
                        fecha_hora: '2025-04-30T14:20:10.000Z',
                        ip: '192.168.1.1',
                        referrer: 'N/A',
                    },
                ],
                meta: {
                    total: 100,
                    page: 1,
                    limit: 20,
                    totalPages: 5,
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    @ApiResponse({
        status: 403,
        description: 'No tiene permisos (requiere rol ADMIN)',
    })
    async getEvents(
        @Param('organizationId') organizationId: string,
        @Query(new ValidationPipe({ whitelist: true, transform: true }))
        query: GetAnalyticsQueryDto,
    ) {
        return await this.analyticsService.getEvents(organizationId, query);
    }

    /**
     * GET /organizations/:organizationId/analytics/events/:eventId
     * Obtiene los detalles completos de un evento específico.
     * 
     * Requiere autenticación y rol de ADMIN.
     */
    @Get('events/:eventId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Obtener detalles de un evento específico',
        description: `
**Uso:** El frontend llama este endpoint cuando el usuario hace clic en "Detalles" 
en la tabla de eventos para ver información completa.

**Retorna:**
- Título del testimonio
- Tipo de evento
- Fecha y hora
- Dirección IP
- Referrer (de dónde vino el usuario)
- Datos del dispositivo (JSON formateado)
- User agent completo

**Nota:** Solo administradores pueden ver detalles de eventos.
    `,
    })
    @ApiParam({
        name: 'organizationId',
        description: 'ID de la organización (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID del evento (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174999',
    })
    @ApiResponse({
        status: 200,
        description: 'Detalles del evento obtenidos exitosamente',
        schema: {
            example: {
                titulo_testimonio: 'Excelente servicio',
                tipo_evento: 'view',
                fecha_hora: '2025-04-30T15:30:22.000Z',
                ip: '203.0.113.1',
                referrer: 'google.com/q=excelente',
                datos_dispositivo:
                    '{\n  "browser": "Chrome",\n  "os": "Windows",\n  "screen_width": 1920,\n  "screen_height": 1080\n}',
                user_agent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    @ApiResponse({
        status: 403,
        description:
            'No tiene permisos (requiere rol ADMIN) o el evento no pertenece a la organización',
    })
    @ApiResponse({
        status: 404,
        description: 'Evento no encontrado',
    })
    async getEventDetails(
        @Param('organizationId') organizationId: string,
        @Param('eventId') eventId: string,
    ) {
        return await this.analyticsService.getEventDetails(eventId, organizationId);
    }
}
