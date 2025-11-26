import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Embed } from "./entities/embed.entity";
import { EmbedbController } from "./embedb.controller";
import { EmbedService } from "./embed.service";

@Module({
    imports: [TypeOrmModule.forFeature([Embed])],
    controllers: [EmbedbController],
    providers: [EmbedService],
    exports: [EmbedService],
})
export class EmbedModule {}