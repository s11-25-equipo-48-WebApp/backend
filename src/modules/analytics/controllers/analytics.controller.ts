import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    ValidationPipe,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from '../analytics.service';
import { GetAnalyticsQueryDto } from '../dto/get-analytics-query.dto';
import { JwtAuthGuard } from 'src/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../../organization/entities/enums';

@ApiTags('Analytics')
@Controller('organizations/:organizationId/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * GET /organizations/:organizationId/analytics/metrics
     * Obtiene las métricas del dashboard de analítica.
     */
    @Get('metrics')
    @Roles(Role.ADMIN, Role.EDITOR)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Obtener métricas del dashboard de analítica',
        description: `
Este endpoint devuelve **todas las métricas principales del dashboard**, usadas en la vista inicial del módulo de Analítica.

---

# 📊 MÉTRICAS QUE RETORNA

### 1. 🟦 testimonios_publicados
Cantidad de testimonios cuyo **status = "aprobado"**.

### 2. 🟩 testimonios_recibidos
Cantidad TOTAL de testimonios (aprobados + rechazados + pendientes).

### 3. 🟨 tasa_aprobacion
Porcentaje de testimonios aprobados respecto al total recibidos.

\`\`\`
tasa_aprobacion = (testimonios_publicados / testimonios_recibidos) × 100
\`\`\`

Ejemplo:  
20 aprobados / 35 recibidos = **57%**

---

### 4. 🟧 tasa_consentimiento
Porcentaje de usuarios que aceptaron el consentimiento para usar su testimonio públicamente.

Se calcula sobre la tabla de **eventos**, NO testimonios.

\`\`\`
tasa_consentimiento = (consent_given / (consent_given + consent_revoked)) × 100
\`\`\`

Ejemplo:  
98 consent_given / 100 eventos = **98%**

---

### 5. 🟥 visualizaciones
Cantidad de eventos con \`event_type = "view"\`.

---

# 📅 FILTRO POR FECHAS (Opcional)

Puedes filtrar todas las métricas por rango de fechas usando:

- \`start_date\` (ISO 8601)
- \`end_date\` (ISO 8601)

Ejemplo:
\`?start_date=2025-03-28&end_date=2025-04-10\`

---

# 🎯 USO EN FRONTEND

Se llama cuando se carga el dashboard:

\`\`\`ts
GET /organizations/org-id/analytics/metrics?start_date=2025-03-28&end_date=2025-04-10
\`\`\`

Retorna los valores usados en las tarjetas del dashboard.
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
        description: 'Métricas del dashboard calculadas exitosamente',
        schema: {
            example: {
                testimonios_publicados: 20,
                testimonios_recibidos: 35,
                tasa_aprobacion: 57,
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
        this.logger.log('========== GET /metrics LLAMADO ==========');
        this.logger.log(`Organization ID: ${organizationId}`);
        this.logger.log(`Start Date: ${startDate || 'NO ESPECIFICADO'}`);
        this.logger.log(`End Date: ${endDate || 'NO ESPECIFICADO'}`);

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const result = await this.analyticsService.getMetrics(organizationId, start, end);

        this.logger.log(`Resultado: ${JSON.stringify(result)}`);
        this.logger.log('========== GET /metrics COMPLETADO ==========');

        return result;
    }

    /**
     * GET /organizations/:organizationId/analytics/events/:eventId
     */
    @Get('events/:eventId')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Obtener detalles completos de un evento de analítica',
        description: `
Devuelve toda la información asociada a un evento específico.

Este endpoint se usa cuando el usuario hace clic en **"Ver detalles"** en la tabla de eventos.

---

# 📌 CAMPOS QUE RETORNA

### 🟦 Información del Testimonio
- **titulo_testimonio** – título del testimonio al que pertenece el evento

### 🟩 Información del Evento
- **tipo_evento** — (view, submission, approval, rejection, consent_given, consent_revoked)
- **fecha_hora**

### 🟨 Datos Técnicos
- **ip**
- **referrer**
- **datos_dispositivo**
- **user_agent**

---

# 🎯 USO EN FRONTEND

\`\`\`ts
GET /organizations/org-id/analytics/events/event-uuid
\`\`\`

Se muestra en un modal con los detalles completos del evento.
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
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    @ApiResponse({
        status: 404,
        description: 'Evento no encontrado',
    })
    async getEventDetails(
        @Param('organizationId') organizationId: string,
        @Param('eventId') eventId: string,
    ) {
        this.logger.log('========== GET /events/:eventId LLAMADO ==========');
        this.logger.log(`Organization ID: ${organizationId}`);
        this.logger.log(`Event ID: ${eventId}`);

        const result = await this.analyticsService.getEventDetails(eventId, organizationId);

        this.logger.log(`Resultado: ${JSON.stringify(result)}`);
        this.logger.log('========== GET /events/:eventId COMPLETADO ==========');

        return result;
    }

    /**
     * GET /organizations/:organizationId/analytics/events
     */
    @Get('events')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Listar eventos de analítica con búsqueda, filtros y paginación',
        description: `
Devuelve una tabla paginada de eventos, incluyendo búsqueda y filtros.

Este endpoint se usa para poblar la **tabla principal** del dashboard de analítica.

---

# 🔍 FILTROS DISPONIBLES

### 1. 📅 Rango de fechas
- \`start_date\`
- \`end_date\`

Ejemplo:
\`?start_date=2025-03-28&end_date=2025-04-10\`

---

### 2. 🎯 Tipo de evento (event_type)
Valores permitidos:

- view  
- submission  
- approval  
- rejection  
- consent_given  
- consent_revoked  

Ejemplo:
\`?event_type=view\`

---

### 3. 🔎 Búsqueda (search)
Busca por **título del testimonio**.

Ejemplo:
\`?search=excelente\`

---

### 4. 📄 Paginación
- \`page\` — página actual
- \`limit\` — cantidad de registros por página

---

# 🎯 USO EN FRONTEND

### Mostrar tabla al cargar:
\`\`\`ts
GET /organizations/org-id/analytics/events?page=1&limit=20
\`\`\`

### Buscar:
\`\`\`ts
GET /organizations/org-id/analytics/events?search=excelente&page=1
\`\`\`

### Filtrar por tipo:
\`\`\`ts
GET /organizations/org-id/analytics/events?event_type=view&page=1
\`\`\`

---

# 📎 RESPUESTA

Incluye:

- \`data[]\` — arreglo de eventos
- \`meta\` — paginación completa

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
        this.logger.log('========== GET /events LLAMADO ==========');
        this.logger.log(`Organization ID: ${organizationId}`);
        this.logger.log(`Query recibida: ${JSON.stringify(query)}`);

        const result = await this.analyticsService.getEvents(organizationId, query);

        this.logger.log(`Resultado (primeros 2): ${JSON.stringify(result?.data?.slice(0, 2))}`);
        this.logger.log('========== GET /events COMPLETADO ==========');

        return result;
    }
}