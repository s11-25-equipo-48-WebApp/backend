import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../entities/tag.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
  ) {}

  create(partial: Partial<Tag>) {
    return this.repo.create(partial);
  }

  save(entity: Tag) {
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

  async deleteRelations(tagId: string): Promise<void> {
    await this.repo.manager
      .createQueryBuilder()
      .delete()
      .from('testimonios_tags')
      .where('tag_id = :tagId', { tagId })
      .execute();
  }
}
