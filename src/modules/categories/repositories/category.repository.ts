import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  create(partial: Partial<Category>) {
    return this.repo.create(partial);
  }

  save(entity: Category) {
    return this.repo.save(entity);
  }

  findOneById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string) {
    return this.repo.findOne({ where: { name } });
  }

  deleteById(id: string) {
    return this.repo.delete({ id });
  }

  // 🔥 REEMPLAZAMOS EL DATA SOURCE POR QUERY BUILDER
  async countTestimoniosByCategory(categoryId: string): Promise<number> {
    return this.repo.manager
      .createQueryBuilder()
      .from('testimonios', 't')
      .where('t.category_id = :categoryId', { categoryId })
      .andWhere('t.deleted_at IS NULL')
      .getCount();
  }

  // 🔥 TAMBIÉN QUERY BUILDER AQUÍ
  async reassignTestimonios(oldId: string, newId: string): Promise<void> {
    await this.repo.manager
      .createQueryBuilder()
      .update('testimonios')
      .set({ category_id: newId })
      .where('category_id = :oldId', { oldId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}
