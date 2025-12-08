import {
    Controller,
    Post,
    Body,
    Param,
    Req,
    ValidationPipe,
    HttpCode,
    HttpStatus,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import type { RequestWithUser } from 'src/common/interfaces/RequestWithUser';
import { Public } from 'src/common/decorators/public.decorator';
import { AnalyticsService } from '../analytics.service';
import { CreateAnalyticsEventDto } from '../dto/create-analytics-event.dto';

/**
 * Controlador PÚBLICO para registrar eventos de analítica.
 * Usa el decorador @Public() para que no requiera autenticación.
 */
@ApiTags('Analytics')
@Controller('organizations/:organizationId/analytics')  // ← Ruta específica igual que AnalyticsController
@Public()
export class AnalyticsPublicController {
    private readonly logger = new Logger(AnalyticsPublicController.name);

    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * POST /organizations/:organizationId/analytics/events
     * Registra un evento de analítica.
     * 
     * ESTE ENDPOINT ES PÚBLICO - NO REQUIERE AUTENTICACIÓN
     */
    @Post('events')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Registrar evento de analítica (PÚBLICO)',
        description: `
**Uso:** El frontend llama este endpoint para registrar eventos importantes.

**Ejemplos de uso:**
- Cuando un usuario **ve** un testimonio en la página pública
- Cuando alguien **envía** un nuevo testimonio
- Cuando un admin **aprueba** o **rechaza** un testimonio
- Cuando un usuario **da consentimiento** para usar su testimonio

**IMPORTANTE:** 
- Este endpoint NO requiere autenticación
- Si el usuario está autenticado, el backend guardará automáticamente su user_id
- Si no está autenticado, el evento se registra igual (user_id será null)

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
        this.logger.log('========== POST /events LLAMADO (PÚBLICO) ==========');
        this.logger.log(`Organization ID: ${organizationId}`);
        this.logger.log(`DTO recibido: ${JSON.stringify(dto)}`);
        this.logger.log(`User ID: ${req?.user?.id || "NO AUTENTICADO"}`);

        const userId = req?.user?.id;

        try {
            const result = await this.analyticsService.trackEvent(
                dto,
                organizationId,
                userId,
            );

            this.logger.log(`Resultado: ${JSON.stringify(result)}`);
            this.logger.log('========== POST /events COMPLETADO ==========');

            return result;

        } catch (error) {
            this.logger.error('Error registrando evento', error);

            // --- Detectar FK Violation de PostgreSQL ---
            if (error?.code === '23503') {
                // Detectar SI la FK falló por testimonio_id
                if (error?.detail?.includes('testimonio_id')) {
                    throw new NotFoundException(
                        `El testimonio con id ${dto.testimonio_id} no existe`
                    );
                }
            }

            // otros errores -> continuar con comportamiento normal
            throw error;
        }
    }

}