import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { GetEmbedQueryDto, GetEmbedQueryWithoutOrgDto, GetEmbedWithLimitQueryDto } from "./dto/get-embed-query.dto";
import { StatusS, Testimonio } from "../testimonios/entities/testimonio.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EmbedService {
    constructor(
        @InjectRepository(Testimonio)
        private readonly testimonioRepo: Repository<Testimonio>,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Obtiene todos los testimonios aprobados de una organización
     */
    async findAllApprovedByOrganization(organizationId: string): Promise<Testimonio[]> {
        return this.testimonioRepo.find({
            where: {
                organization: { id: organizationId },
                status: StatusS.APROBADO,
            },
            order: { created_at: "DESC" },
        });
    }

    /**
     * Obtiene testimonios aprobados con límite
     */
    async findApprovedByOrganizationWithLimit(organizationId: string, limit: number): Promise<Testimonio[]> {
        return this.testimonioRepo.find({
            where: {
                organization: { id: organizationId },
                status: StatusS.APROBADO,
            },
            order: { created_at: "DESC" },
            take: limit,
        });
    }

    /**
     * Obtiene un testimonio individual aprobado por ID y organización
     */
    async findApprovedPublicById(id: string, organizationId: string): Promise<Testimonio | null> {
        return this.testimonioRepo.findOne({
            where: {
                id,
                organization: { id: organizationId },
                status: StatusS.APROBADO,
            },
        });
    }

    /**
     * Genera el código iframe completo para un testimonio individual
     * Este código es el que el usuario copiará y pegará en su sitio web
     */
    async generateSingleIframeCode(id: string, organizationId: string, query: GetEmbedQueryDto): Promise<string> {
        // Verificar que el testimonio existe y está aprobado
        const testimonio = await this.findApprovedPublicById(id, organizationId);
        if (!testimonio) {
            throw new NotFoundException("Testimonio no encontrado o no está aprobado");
        }

        const { width = "600", height = "400", theme = "light", autoplay = false } = query;
        const baseUrl = this.configService.get<string>("API_URL") || "http://localhost:3002";
        
        // URL que apunta al endpoint que renderiza el contenido
        const contentUrl = `${baseUrl}/api/v1/api/public/embed/content/${id}?organizationId=${organizationId}&width=${width}&height=${height}&theme=${theme}&autoplay=${autoplay}`;

        return `<iframe src="${contentUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen loading="lazy" style="border: 1px solid ${theme === "dark" ? "#555" : "#ccc"}; border-radius: 8px;"></iframe>`;
    }

    /**
     * Genera el código iframe para múltiples testimonios de una organización
     */
    async generateOrganizationIframeCode(organizationId: string, query: GetEmbedQueryWithoutOrgDto): Promise<string> {
        const { width = "600", height = "600", theme = "light" } = query;
        const baseUrl = this.configService.get<string>("API_URL") || "http://localhost:3002";
        
        const contentUrl = `${baseUrl}/api/v1/api/public/embed/organization/${organizationId}/testimonios?width=${width}&height=${height}&theme=${theme}`;

        return `<iframe src="${contentUrl}" width="${width}" height="${height}" frameborder="0" loading="lazy" style="border: 1px solid ${theme === "dark" ? "#555" : "#ccc"}; border-radius: 8px;"></iframe>`;
    }

    /**
     * Genera el código iframe para testimonios con límite personalizado
     */
    async generateOrganizationIframeCodeWithLimit(organizationId: string, query: GetEmbedWithLimitQueryDto): Promise<string> {
        const { width = "600", height = "600", theme = "light", limit = 5 } = query;
        const baseUrl = this.configService.get<string>("API_URL") || "http://localhost:3002";
        
        const contentUrl = `${baseUrl}/api/v1/api/public/embed/organization/${organizationId}/testimonios/limited?width=${width}&height=${height}&theme=${theme}&limit=${limit}`;

        return `<iframe src="${contentUrl}" width="${width}" height="${height}" frameborder="0" loading="lazy" style="border: 1px solid ${theme === "dark" ? "#555" : "#ccc"}; border-radius: 8px;"></iframe>`;
    }

    /**
     * Genera el HTML completo para un testimonio individual
     * Este HTML se renderiza dentro del iframe
     */
    async generateSingleTestimonialHtml(id: string, organizationId: string, query: GetEmbedQueryDto): Promise<string> {
        const testimonio = await this.findApprovedPublicById(id, organizationId);
        
        if (!testimonio) {
            throw new NotFoundException("Testimonio no encontrado o no está aprobado");
        }

        const { theme = "light", autoplay = false, showAvatar = true, showVehicle = true } = query;
        const backgroundColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
        const textColor = theme === "dark" ? "#ffffff" : "#333333";
        
        const testimonialCard = this.generateTestimonialCard(testimonio, { theme, autoplay, showAvatar, showVehicle });

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testimonio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${backgroundColor};
            color: ${textColor};
            padding: 20px;
            line-height: 1.6;
        }
        .testimonial-card {
            background: ${theme === "dark" ? "#2a2a2a" : "#ffffff"};
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, ${theme === "dark" ? "0.4" : "0.1"});
            max-width: 100%;
        }
        .author-info {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-right: 12px;
            background: linear-gradient(135deg, ${theme === "dark" ? "#667eea, #764ba2" : "#667eea, #764ba2"});
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            color: #ffffff;
            flex-shrink: 0;
        }
        .avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        .author-details {
            flex: 1;
        }
        .author-name {
            font-weight: 600;
            font-size: 16px;
            color: ${textColor};
            margin-bottom: 2px;
        }
        .author-email {
            font-size: 13px;
            color: ${theme === "dark" ? "#aaa" : "#666"};
        }
        .testimonial-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 12px;
            color: ${textColor};
            line-height: 1.3;
        }
        .media-container {
            margin: 16px 0;
            border-radius: 12px;
            overflow: hidden;
            background: ${theme === "dark" ? "#000" : "#000"};
            position: relative;
        }
        .media-container img {
            width: 100%;
            height: auto;
            display: block;
        }
        .media-container iframe {
            width: 100%;
            height: 315px;
            border: none;
            display: block;
        }
        .testimonial-body {
            font-size: 15px;
            line-height: 1.7;
            color: ${theme === "dark" ? "#e0e0e0" : "#444"};
            margin-bottom: 16px;
            white-space: pre-wrap;
        }
        .vehicle-badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 14px;
            background: ${theme === "dark" ? "linear-gradient(135deg, #667eea, #764ba2)" : "linear-gradient(135deg, #667eea, #764ba2)"};
            border-radius: 20px;
            font-size: 13px;
            color: #ffffff;
            font-weight: 500;
            margin-top: 12px;
        }
        .vehicle-badge svg {
            margin-right: 6px;
        }
        .footer {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid ${theme === "dark" ? "#3a3a3a" : "#e0e0e0"};
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .timestamp {
            font-size: 13px;
            color: ${theme === "dark" ? "#888" : "#999"};
        }
        .verified-badge {
            display: inline-flex;
            align-items: center;
            font-size: 12px;
            color: ${theme === "dark" ? "#4ade80" : "#16a34a"};
            font-weight: 500;
        }
        .verified-badge svg {
            margin-right: 4px;
        }
        @media (max-width: 600px) {
            body {
                padding: 12px;
            }
            .testimonial-card {
                padding: 16px;
            }
            .media-container iframe {
                height: 220px;
            }
        }
    </style>
</head>
<body>
    ${testimonialCard}
</body>
</html>`;
    }

    /**
     * Genera el HTML para múltiples testimonios de una organización
     * Se muestra como un carrusel o lista de testimonios
     */
    async generateOrganizationTestimonialsHtml(organizationId: string, query: GetEmbedQueryWithoutOrgDto): Promise<string> {
        const testimonios = await this.findAllApprovedByOrganization(organizationId);

        if (!testimonios || testimonios.length === 0) {
            return this.generateEmptyStateHtml(query.theme || "light");
        }

        const { theme = "light", autoplay = false, showAvatar = true, showVehicle = true } = query;
        const backgroundColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
        const textColor = theme === "dark" ? "#ffffff" : "#333333";

        const testimoniosHtml = testimonios.map((t, index) => 
            this.generateTestimonialCard(t, { theme, autoplay, showAvatar, showVehicle, index })
        ).join("\n");

        return this.generateMultipleTestimonialsHtmlWrapper(testimoniosHtml, theme, backgroundColor, textColor);
    }

    /**
     * Genera el HTML para testimonios con límite personalizado
     */
    async generateOrganizationTestimonialsHtmlWithLimit(organizationId: string, query: GetEmbedWithLimitQueryDto): Promise<string> {
        const { limit = 5 } = query;
        const testimonios = await this.findApprovedByOrganizationWithLimit(organizationId, limit);

        if (!testimonios || testimonios.length === 0) {
            return this.generateEmptyStateHtml(query.theme || "light");
        }

        const { theme = "light", autoplay = false, showAvatar = true, showVehicle = true } = query;
        const backgroundColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
        const textColor = theme === "dark" ? "#ffffff" : "#333333";

        const testimoniosHtml = testimonios.map((t, index) => 
            this.generateTestimonialCard(t, { theme, autoplay, showAvatar, showVehicle, index })
        ).join("\n");

        return this.generateMultipleTestimonialsHtmlWrapper(testimoniosHtml, theme, backgroundColor, textColor);
    }

    /**
     * Genera el HTML wrapper para múltiples testimonios
     */
    private generateMultipleTestimonialsHtmlWrapper(testimoniosHtml: string, theme: "light" | "dark", backgroundColor: string, textColor: string): string {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testimonios</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${backgroundColor};
            color: ${textColor};
            padding: 20px;
            overflow-y: auto;
            overflow-x: hidden;
        }
        .testimonials-container {
            max-width: 100%;
            margin: 0 auto;
        }
        .testimonial-card {
            background: ${theme === "dark" ? "#2a2a2a" : "#ffffff"};
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, ${theme === "dark" ? "0.4" : "0.1"});
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .testimonial-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, ${theme === "dark" ? "0.5" : "0.15"});
        }
        .author-info {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-right: 12px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            color: #ffffff;
            flex-shrink: 0;
        }
        .avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        .author-details {
            flex: 1;
        }
        .author-name {
            font-weight: 600;
            font-size: 16px;
            color: ${textColor};
            margin-bottom: 2px;
        }
        .author-email {
            font-size: 13px;
            color: ${theme === "dark" ? "#aaa" : "#666"};
        }
        .media-container {
            margin: 16px 0;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
        }
        .media-container img {
            width: 100%;
            height: auto;
            display: block;
        }
        .media-container iframe {
            width: 100%;
            height: 315px;
            border: none;
        }
        .testimonial-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
            color: ${textColor};
            line-height: 1.3;
        }
        .testimonial-body {
            font-size: 15px;
            line-height: 1.7;
            color: ${theme === "dark" ? "#e0e0e0" : "#444"};
            margin-bottom: 12px;
            white-space: pre-wrap;
        }
        .vehicle-badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 20px;
            font-size: 13px;
            color: #ffffff;
            font-weight: 500;
            margin-top: 12px;
        }
        .vehicle-badge svg {
            margin-right: 6px;
        }
        .footer {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid ${theme === "dark" ? "#3a3a3a" : "#e0e0e0"};
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .timestamp {
            font-size: 13px;
            color: ${theme === "dark" ? "#888" : "#999"};
        }
        .verified-badge {
            display: inline-flex;
            align-items: center;
            font-size: 12px;
            color: ${theme === "dark" ? "#4ade80" : "#16a34a"};
            font-weight: 500;
        }
        .verified-badge svg {
            margin-right: 4px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .testimonial-card {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="testimonials-container">
        ${testimoniosHtml}
    </div>
</body>
</html>`;
    }

    /**
     * Genera una tarjeta HTML individual de testimonio
     */
    private generateTestimonialCard(
        testimonio: Testimonio, 
        options: { 
            theme: "light" | "dark", 
            autoplay: boolean, 
            showAvatar: boolean, 
            showVehicle: boolean,
            index?: number 
        }
    ): string {
        const { theme, autoplay, showAvatar, showVehicle } = options;
        const authorName = testimonio.author_name || "Usuario Anónimo";
        const authorEmail = testimonio.author_email || "";
        const authorInitial = authorName.charAt(0).toUpperCase();

        // Avatar HTML con mejor estilo
        const avatarHtml = showAvatar ? `
            <div class="author-info">
                <div class="avatar">
                    ${authorInitial}
                </div>
                <div class="author-details">
                    <div class="author-name">${this.escapeHtml(authorName)}</div>
                    ${authorEmail ? `<div class="author-email">${this.escapeHtml(authorEmail)}</div>` : ""}
                </div>
            </div>` : "";

        // Media HTML (imagen o video)
        let mediaHtml = "";
        if (testimonio.media_url) {
            if (testimonio.media_type === "image") {
                mediaHtml = `
                    <div class="media-container">
                        <img src="${this.escapeHtml(testimonio.media_url)}" alt="Imagen del testimonio" loading="lazy">
                    </div>`;
            } else if (testimonio.media_type === "video") {
                const videoUrl = this.convertToEmbedUrl(testimonio.media_url, autoplay);
                mediaHtml = `
                    <div class="media-container">
                        <iframe 
                            src="${videoUrl}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                            loading="lazy"
                        ></iframe>
                    </div>`;
            }
        }

        // Vehicle badge con icono SVG
        const vehicleHtml = showVehicle && testimonio.title ? `
            <div class="vehicle-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 17h-2v-3l2-4h10l2 4v3h-2m-12 0a2 2 0 1 0 4 0m-4 0h4m8 0a2 2 0 1 0 4 0m-4 0h4"/>
                    <path d="M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/>
                </svg>
                ${this.escapeHtml(testimonio.title)}
            </div>` : "";

        const formattedDate = new Date(testimonio.created_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        // Badge de verificado
        const verifiedBadge = `
            <div class="verified-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Verificado
            </div>`;

        return `
        <div class="testimonial-card">
            ${avatarHtml}
            ${testimonio.title ? `<div class="testimonial-title">${this.escapeHtml(testimonio.title)}</div>` : ""}
            ${mediaHtml}
            <div class="testimonial-body">${this.escapeHtml(testimonio.body)}</div>
            ${vehicleHtml}
            <div class="footer">
                <div class="timestamp">📅 ${formattedDate}</div>
                ${verifiedBadge}
            </div>
        </div>`;
    }

    /**
     * Genera HTML para cuando no hay testimonios
     */
    private generateEmptyStateHtml(theme: "light" | "dark"): string {
        const backgroundColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
        const textColor = theme === "dark" ? "#aaa" : "#666";

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sin Testimonios</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${backgroundColor};
            color: ${textColor};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .empty-state {
            padding: 40px;
        }
        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <h2>No hay testimonios disponibles</h2>
        <p>Aún no se han aprobado testimonios para mostrar.</p>
    </div>
</body>
</html>`;
    }

    /**
     * Convierte URLs de YouTube/Vimeo a formato embed
     */
    private convertToEmbedUrl(url: string, autoplay: boolean): string {
        let embedUrl = url;

        // YouTube
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = this.extractYouTubeId(url);
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? "&autoplay=1" : ""}`;
            }
        }
        // Vimeo
        else if (url.includes("vimeo.com")) {
            const videoId = url.split("/").pop();
            embedUrl = `https://player.vimeo.com/video/${videoId}?${autoplay ? "autoplay=1&" : ""}title=0&byline=0&portrait=0`;
        }

        return embedUrl;
    }

    /**
     * Extrae el ID de un video de YouTube
     */
    private extractYouTubeId(url: string): string | null {
        const patterns = [
            /youtube\.com\/watch\?v=([^&]+)/,
            /youtube\.com\/embed\/([^?]+)/,
            /youtu\.be\/([^?]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
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
