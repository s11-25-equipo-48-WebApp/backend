import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { TagRepository } from './repositories/tag.repository';
import { UniqueTagName } from './validators/unique-tag-name.validator';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Testimonio])],
  controllers: [TagsController],
  providers: [TagsService, TagRepository, UniqueTagName],
  exports: [TagsService],
})
export class TagsModule {}
