import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Testimonio } from '../entities/testimonio.entity';
import { Repository, IsNull } from 'typeorm';

@Injectable()
export class TestimonioRepository {
  constructor(
    @InjectRepository(Testimonio)
    private readonly repo: Repository<Testimonio>,
  ) {}

  create(partial: Partial<Testimonio>) {
    return this.repo.create(partial);
  }

  save(entity: Testimonio) {
    return this.repo.save(entity);
  }

  findOneById(id: string) {
    return this.repo.findOne({ where: { id, deleted_at: IsNull() } });
  }

async softDelete(entity: Testimonio) {
    entity.deleted_at = new Date();
    return this.repo.save(entity);
  }

  findPublic(options?: any) {
    return this.repo.find({
      where: { deleted_at: null },
      ...options,
    });
  }

async findPublicWithFilters(opts: {
  category_id?: string;
  tag_id?: string;
  page?: number;
  limit?: number;
}): Promise<[Testimonio[], number]> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const skip = (page - 1) * limit;

  const qb = this.repo.createQueryBuilder('t')
    .leftJoinAndSelect('t.category', 'category')
    .leftJoinAndSelect('t.tags', 'tag')
    .where('t.deleted_at IS NULL');

  if (opts.category_id) {
    qb.andWhere('category.id = :categoryId', { categoryId: opts.category_id });
  }

  if (opts.tag_id) {
    qb.andWhere('tag.id = :tagId', { tagId: opts.tag_id });
  }

  qb.orderBy('t.created_at', 'DESC').skip(skip).take(limit);

  return qb.getManyAndCount();
}

}
