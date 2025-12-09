import { Controller, Get, Param, Query, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { EmbedService } from "./embed.service";
import { GetEmbedQueryDto } from "./dto/get-embed-query.dto";
import { Public } from "../../common/decorators/public.decorator";
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags("Embed")
@Controller("api/public/embed/content")
export class EmbedbController {
    constructor(
        private readonly embedService: EmbedService,
    ) { }

    @ApiOperation({ summary: "Genera el HTML embebido de un testimonio individual con avatar y auto" })
    @Public()
    @Get(":id")
    @Header("Content-Type", "text/html; charset=utf-8")
    @Header("X-Frame-Options", "ALLOWALL")
    async getSingleEmbed(
        @Param("id") id: string,
        @Query() query: GetEmbedQueryDto,
        @Res() res: Response
    ): Promise<void> {
        const html = await this.embedService.generateTestimonialContentHtml(id, query.organizationId, query);
        res.send(html);
    }

    @ApiOperation({ summary: "Genera el código iframe para incrustar un testimonio individual" })
    @Public()
    @Get(":id/code")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async getSingleEmbedCode(
        @Param("id") id: string,
        @Query() query: GetEmbedQueryDto
    ): Promise<string> {
        return this.embedService.generateIframeEmbedCode(id, query.organizationId, query);
    }

    //Endpoint para obtener los ultimos testimonios de una organización 1 o más
    // @ApiOperation({ summary: "Genera el HTML embebido de los testimonios aprobados de una organización" })
    // @Public()
    // @Get(":organizationId/testimonios")
    // @Header("Content-Type", "text/html; charset=utf-8")
    // @Header("X-Frame-Options", "ALLOWALL")
    // async getOrganizationTestimoniosEmbed(
    //     @Param("organizationId") organizationId: string,
    //     @Query() query: GetEmbedQueryDto,
    //     @Res() res: Response
    // ): Promise<void> {
    //     const html = await this.embedService.generateOrganizationTestimonialContentHtml(organizationId, query);
    //     res.send(html);
    // }
}
