import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { TagRepository } from './repositories/tag.repository';
import { UniqueTagName } from './validators/unique-tag-name.validator';
import { Organization } from '../organization/entities/organization.entity';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Testimonio]), OrganizationModule],
  controllers: [TagsController],
  providers: [TagsService, TagRepository, UniqueTagName],
  exports: [TagsService],
})
export class TagsModule { }
