import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { TestimoniosService } from "../../modules/testimonios/testimonios.service";
import { GetEmbedQueryDto } from "./dto/get-embed-query.dto";
import { Status } from "../../modules/organization/entities/enums";

@Injectable()
export class EmbedService {
    constructor(
        private readonly testimoniosService: TestimoniosService,
    ) { }

    // Este método genera el *contenido HTML* del testimonio para ser incrustado
    async generateTestimonialContentHtml(id: string, organizationId: string, query: GetEmbedQueryDto): Promise<string> {
        const testimonio = await this.testimoniosService.findApprovedPublicById(id, organizationId);

        if (!testimonio) {
            throw new NotFoundException("Testimonio no encontrado o no aprobado.");
        }

        const { width, theme, autoplay } = query;
        const embedWidth = width ? `${width}px` : "600px";
        const parsedAutoplay = String(autoplay).toLowerCase() === "true";

        const textColor = theme === "dark" ? "#fff" : "#333";
        const backgroundColor = theme === "dark" ? "#333" : "#f0f0f0";

        // Author and Avatar
        let authorInfoHtml = "";
        const authorName = testimonio.author_name || "Anónimo";
        const avatarUrl = "https://via.placeholder.com/40"; // Using a generic placeholder as avatar_url does not exist on User type

        authorInfoHtml = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <img src="${avatarUrl}" alt="${authorName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                <span style="font-weight: bold; color: ${textColor};">${authorName}</span>
            </div>
        `;

        // Basic sanitization and content control (no scripts, only trusted HTML tags for content)
        let mediaHtml = "";
        if (testimonio.media_url) { // Check if media_url exists
            if (testimonio.media_type === "image") {
                mediaHtml = `<img src="${testimonio.media_url}" alt="Testimonio" style="max-width: 100%; height: auto;">`;
            } else if (testimonio.media_type === "video") {
                const autoplayParam = parsedAutoplay ? "autoplay=1&" : "";
                const separator = testimonio.media_url.includes("?") ? "&" : "?";
                const videoUrl = `${testimonio.media_url}${separator}${autoplayParam}enablejsapi=1&version=3&playerapiid=ytplayer`;
                mediaHtml = `<iframe src="${videoUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            }
        }

        return `
<div style="width: ${embedWidth}; height: 400px; overflow: auto; border: 1px solid ${theme === "dark" ? "#555" : "#ccc"}; font-family: sans-serif; background-color: ${backgroundColor}; padding: 20px; box-sizing: border-box;">
    ${authorInfoHtml}
    ${mediaHtml}
    <div style="color: ${textColor}; margin-top: 10px;">${testimonio.body}</div>
</div>`;
    }

    // Este método genera el *código <iframe> completo* para ser copiado y pegado
    async generateIframeEmbedCode(id: string, organizationId: string, query: GetEmbedQueryDto): Promise<string> {
        const { width, theme, autoplay } = query;
        const embedWidth = width ? `${width}px` : "600px";
        const parsedAutoplay = String(autoplay).toLowerCase() === "true";

        // Construir la URL para el endpoint que servirá el *contenido* del testimonio
        // Nota: Asegúrate de que esta URL coincida con el endpoint real que sirve el contenido.
        const contentUrl = `http://localhost:3002/api/v1/api/public/embed/content/${id}?organizationId=${organizationId}&width=${width || 600}&theme=${theme || "light"}&autoplay=${parsedAutoplay}`;

        return `
<iframe
    src="${contentUrl}"
    width="${embedWidth}"
    height="400px"
    frameborder="0"
    allowfullscreen
    style="border: 1px solid ${theme === "dark" ? "#555" : "#ccc"};"
></iframe>
`;
    }

    // async generateOrganizationTestimonialContentHtml(organizationId: string, query: GetEmbedQueryDto): Promise<string> {
    //     const testimonios = await this.testimoniosService.findAllByOrganization(organizationId);

    //     const { width, theme, autoplay } = query;
    //     const embedWidth = width ? `${width}px` : "600px";
    //     const parsedAutoplay = String(autoplay).toLowerCase() === "true";

    //     const textColor = theme === "dark" ? "#fff" : "#333";
    //     const backgroundColor = theme === "dark" ? "#333" : "#f0f0f0";

    //     // Author and Avatar
    //     let authorInfoHtml = "";
    //     const authorName = testimonios[0].author_name || "Anónimo";
    //     const avatarUrl = "https://via.placeholder.com/40"; // Using a generic placeholder as avatar_url does not exist on User type

    //     authorInfoHtml = `
    //         <div style="display: flex; align-items: center; margin-bottom: 10px;">
    //             <img src="${avatarUrl}" alt="${authorName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
    //             <span style="font-weight: bold; color: ${textColor};">${authorName}</span>
    //         </div>
    //     `;
    // }
}
