import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { CategoryRepository } from './repositories/category.repository';
import { UniqueCategoryName } from './validators/unique-category-name.validator';
import { Organization } from '../organization/entities/organization.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Category, Testimonio, Organization])],
  controllers: [CategoriesController],
   providers: [CategoriesService, CategoryRepository, UniqueCategoryName],
   exports: [CategoriesService],
})
export class CategoriesModule {}
