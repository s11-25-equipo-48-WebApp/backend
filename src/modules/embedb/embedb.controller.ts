import { Controller, Get, Param, Query, Header, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { EmbedService } from "./embed.service";
import { GetEmbedQueryDto, GetEmbedQueryWithoutOrgDto, GetEmbedWithLimitQueryDto } from "./dto/get-embed-query.dto";
import { Public } from "../../common/decorators/public.decorator";
import { ApiOperation, ApiTags, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags("Embed - Testimonios Incrustables")
@Controller("api/public/embed")
export class EmbedbController {
    constructor(
        private readonly embedService: EmbedService,
    ) { }

    // ==================== ENDPOINTS PARA OBTENER CÓDIGO IFRAME ====================

    /**
     * Genera el código iframe para incrustar un testimonio individual
     * Este es el código que el usuario copiará y pegará en su sitio web
     */
    @ApiOperation({
        summary: "Obtener código iframe para un testimonio individual",
        description: "Retorna el código HTML completo del iframe que el usuario debe copiar y pegar en su sitio web para mostrar un testimonio específico."
    })
    @ApiParam({ name: "id", description: "ID del testimonio a incrustar" })
    @ApiResponse({ status: 200, description: "Código iframe generado exitosamente" })
    @ApiResponse({ status: 404, description: "Testimonio no encontrado o no aprobado" })
    @Public()
    @Get("code/testimonio/:id")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async getSingleTestimonialIframeCode(
        @Param("id") id: string,
        @Query() query: GetEmbedQueryDto,
        @Res() res: Response
    ): Promise<void> {
        const iframeCode = await this.embedService.generateSingleIframeCode(id, query.organizationId, query);
        res.send(iframeCode);
    }

    /**
     * Genera el código iframe para incrustar todos los testimonios de una organización
     */
    @ApiOperation({
        summary: "Obtener código iframe para testimonios de una organización",
        description: "Retorna el código HTML completo del iframe para mostrar todos los testimonios aprobados de una organización."
    })
    @ApiParam({ name: "organizationId", description: "ID de la organización" })
    @ApiResponse({ status: 200, description: "Código iframe generado exitosamente" })
    @ApiResponse({ status: 404, description: "Organización no encontrada o sin testimonios aprobados" })
    @Public()
    @Get("code/organization/:organizationId/testimonios")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async getOrganizationTestimonialsIframeCode(
        @Param("organizationId") organizationId: string,
        @Query() query: GetEmbedQueryWithoutOrgDto,
        @Res() res: Response
    ): Promise<void> {
        const iframeCode = await this.embedService.generateOrganizationIframeCode(organizationId, query);
        res.send(iframeCode);
    }

    /**
     * 🆕 NUEVO: Genera el código iframe con límite personalizado de testimonios
     * El usuario puede especificar cuántos testimonios quiere mostrar (1-20)
     */
    @ApiOperation({
        summary: "Obtener código iframe con límite de testimonios",
        description: "Retorna el código iframe para mostrar una cantidad específica de testimonios (1-20). Ideal para mostrar solo los últimos N testimonios."
    })
    @ApiParam({ name: "organizationId", description: "ID de la organización" })
    @ApiQuery({ name: "limit", required: false, description: "Cantidad de testimonios a mostrar (1-20)", example: 5 })
    @ApiResponse({ status: 200, description: "Código iframe generado exitosamente" })
    @ApiResponse({ status: 400, description: "Parámetro limit inválido" })
    @ApiResponse({ status: 404, description: "Organización no encontrada" })

    @Public()
    @Get("code/organization/:organizationId/testimonios/limited")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async getOrganizationTestimonialsLimitedIframeCode(
        @Param("organizationId") organizationId: string,
        @Query() query: GetEmbedWithLimitQueryDto,
        @Res() res: Response
    ): Promise<void> {
        const iframeCode = await this.embedService.generateOrganizationIframeCodeWithLimit(organizationId, query);
        res.send(iframeCode);
    }

    // ==================== ENDPOINTS PARA RENDERIZAR CONTENIDO ====================

    /**
     * Renderiza el HTML de un testimonio individual
     * Este endpoint es llamado automáticamente por el iframe
     */
    @ApiOperation({
        summary: "Renderizar contenido HTML de un testimonio individual",
        description: "Este endpoint es usado internamente por el iframe para mostrar el contenido del testimonio. No debe ser llamado directamente por los usuarios."
    })
    @ApiParam({ name: "id", description: "ID del testimonio" })
    @ApiResponse({ status: 200, description: "HTML del testimonio renderizado" })
    @ApiResponse({ status: 404, description: "Testimonio no encontrado" })
    @Public()
    @Get("content/:id")
    @Header("Content-Type", "text/html; charset=utf-8")
    @Header("X-Frame-Options", "ALLOWALL")
    @Header("Access-Control-Allow-Origin", "*")
    async getSingleTestimonialContent(
        @Param("id") id: string,
        @Query() query: GetEmbedQueryDto,
        @Res() res: Response
    ): Promise<void> {
        try {
            const html = await this.embedService.generateSingleTestimonialHtml(id, query.organizationId, query);
            res.status(HttpStatus.OK).send(html);
        } catch (error) {
            const errorHtml = this.generateErrorHtml(error.message, query.theme || "light");
            res.status(HttpStatus.NOT_FOUND).send(errorHtml);
        }
    }

    /**
     * Renderiza el HTML de todos los testimonios de una organización
     * Este endpoint es llamado automáticamente por el iframe
     */
    @ApiOperation({
        summary: "Renderizar contenido HTML de testimonios de una organización",
        description: "Este endpoint es usado internamente por el iframe para mostrar los testimonios de una organización. No debe ser llamado directamente por los usuarios."
    })
    @ApiParam({ name: "organizationId", description: "ID de la organización" })
    @ApiResponse({ status: 200, description: "HTML de testimonios renderizado" })
    @ApiResponse({ status: 500, description: "Error interno al renderizar testimonios" })
    @Public()
    @Get("organization/:organizationId/testimonios")
    @Header("Content-Type", "text/html; charset=utf-8")
    @Header("X-Frame-Options", "ALLOWALL")
    @Header("Access-Control-Allow-Origin", "*")
    async getOrganizationTestimonialsContent(
        @Param("organizationId") organizationId: string,
        @Query() query: GetEmbedQueryWithoutOrgDto,
        @Res() res: Response
    ): Promise<void> {
        try {
            const html = await this.embedService.generateOrganizationTestimonialsHtml(organizationId, query);
            res.status(HttpStatus.OK).send(html);
        } catch (error) {
            const errorHtml = this.generateErrorHtml(error.message, query.theme || "light");
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorHtml);
        }
    }

    /**
     * 🆕 NUEVO: Renderiza el HTML con límite de testimonios
     * Este endpoint es llamado automáticamente por el iframe
     */
    @ApiOperation({
        summary: "Renderizar contenido HTML con límite de testimonios",
        description: "Este endpoint es usado internamente por el iframe para mostrar una cantidad limitada de testimonios."
    })
    @ApiParam({ name: "organizationId", description: "ID de la organización" })
    @ApiResponse({ status: 200, description: "HTML renderizado con límite" })
    @ApiResponse({ status: 500, description: "Error interno al renderizar testimonios" })
    @Public()
    @Get("organization/:organizationId/testimonios/limited")
    @Header("Content-Type", "text/html; charset=utf-8")
    @Header("X-Frame-Options", "ALLOWALL")
    @Header("Access-Control-Allow-Origin", "*")
    async getOrganizationTestimonialsLimitedContent(
        @Param("organizationId") organizationId: string,
        @Query() query: GetEmbedWithLimitQueryDto,
        @Res() res: Response
    ): Promise<void> {
        try {
            const html = await this.embedService.generateOrganizationTestimonialsHtmlWithLimit(organizationId, query);
            res.status(HttpStatus.OK).send(html);
        } catch (error) {
            const errorHtml = this.generateErrorHtml(error.message, query.theme || "light");
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorHtml);
        }
    }

    // ==================== ENDPOINTS DE UTILIDAD ====================

    /**
     * Obtiene lista de testimonios aprobados (JSON)
     * Útil para previsualización o debugging
     */
    @ApiOperation({
        summary: "Listar testimonios aprobados de una organización (JSON)",
        description: "Retorna un JSON con los testimonios aprobados. Útil para debugging o crear previsualización personalizada."
    })
    @ApiResponse({ status: 200, description: "Lista de testimonios aprobados (JSON)" })
    @ApiResponse({ status: 404, description: "Organización no encontrada o sin testimonios" })
    @Public()
    @Get("data/organization/:organizationId/testimonios")
    async getOrganizationTestimonialsData(
        @Param("organizationId") organizationId: string
    ) {
        const testimonios = await this.embedService.findAllApprovedByOrganization(organizationId);
        return {
            success: true,
            count: testimonios.length,
            data: testimonios.map(t => ({
                id: t.id,
                title: t.title,
                body: t.body,
                author_name: t.author_name,
                author_email: t.author_email,
                media_url: t.media_url,
                media_type: t.media_type,
                created_at: t.created_at,
            }))
        };
    }

    /**
     * Obtiene un testimonio individual (JSON)
     */
    @ApiOperation({
        summary: "Obtener un testimonio individual (JSON)",
        description: "Retorna los datos de un testimonio específico en formato JSON."
    })
    @ApiResponse({ status: 200, description: "Testimonio encontrado" })
    @ApiResponse({ status: 404, description: "Testimonio no encontrado o no aprobado" })
    @Public()
    @Get("data/testimonio/:id")
    async getSingleTestimonialData(
        @Param("id") id: string,
        @Query("organizationId") organizationId: string
    ) {
        const testimonio = await this.embedService.findApprovedPublicById(id, organizationId);

        if (!testimonio) {
            return {
                success: false,
                message: "Testimonio no encontrado o no aprobado"
            };
        }

        return {
            success: true,
            data: {
                id: testimonio.id,
                title: testimonio.title,
                body: testimonio.body,
                author_name: testimonio.author_name,
                author_email: testimonio.author_email,
                media_url: testimonio.media_url,
                media_type: testimonio.media_type,
                created_at: testimonio.created_at,
            }
        };
    }

    // ==================== MÉTODO PRIVADO ====================

    /**
     * Genera HTML de error para mostrar en el iframe
     */
    private generateErrorHtml(message: string, theme: "light" | "dark"): string {
        const backgroundColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
        const textColor = theme === "dark" ? "#ff6b6b" : "#e03131";
        const borderColor = theme === "dark" ? "#ff6b6b" : "#ffc9c9";

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${backgroundColor};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            padding: 30px;
            border: 2px solid ${borderColor};
            border-radius: 12px;
            background: ${theme === "dark" ? "#2a2a2a" : "#fff5f5"};
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        .error-message {
            color: ${textColor};
            font-size: 16px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${this.escapeHtml(message)}</div>
    </div>
</body>
</html>`;
    }

    /**
     * Escapa caracteres HTML
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (char) => map[char]);
    }
}
