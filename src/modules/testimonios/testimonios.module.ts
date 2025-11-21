import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Testimonio } from './entities/testimonio.entity';
import { TestimoniosController } from './testimonios.controller';
import { TestimoniosService } from './testimonios.service';
import { TestimonioRepository } from './repository/testimonio.repository';
import { CategoryExists } from './validators/category-exists.validator';
import { TagsExist } from './validators/tags-exist.validator';
import { AuditLog } from './entities/audit-log.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';



@Module({
  imports: [TypeOrmModule.forFeature([Testimonio, Category, Tag, AuditLog])],
  controllers: [TestimoniosController],
  providers: [
    TestimoniosService,
    TestimonioRepository,
    CategoryExists,
    TagsExist,
  ],
  exports: [TestimoniosService],
})
export class TestimoniosModule {}
