import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Embed } from "./entities/embed.entity";
import { Testimonio } from "../testimonios/entities/testimonio.entity";
import { EmbedbController } from "./embedb.controller";
import { EmbedService } from "./embed.service";
import { TestimoniosModule } from "../../modules/testimonios/testimonios.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Embed, Testimonio]), 
        TestimoniosModule
    ],
    controllers: [EmbedbController],
    providers: [EmbedService],
    exports: [EmbedService],
})
export class EmbedModule {}
