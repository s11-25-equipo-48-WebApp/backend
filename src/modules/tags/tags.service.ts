import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TagRepository } from './repositories/tag.repository';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Testimonio } from '../testimonios/entities/testimonio.entity';

@Injectable()
export class TagsService {
  constructor(
    private readonly repo: TagRepository,
    @InjectRepository(Testimonio)
    private readonly testimonioRepo: Repository<Testimonio>,
  ) {}

  async create(dto: CreateTagDto): Promise<Tag> {
    const exists = await this.repo.findByName(dto.name);
    if (exists) throw new BadRequestException(`Tag with name "${dto.name}" already exists`);

    const entity = this.repo.create({ name: dto.name } as Partial<Tag>);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const entity = await this.repo.findOneById(id);
    if (!entity) throw new NotFoundException(`Tag with id ${id} not found`);

    if (dto.name && dto.name !== entity.name) {
      const other = await this.repo.findByName(dto.name);
      if (other && other.id !== id) {
        throw new BadRequestException(`Tag with name "${dto.name}" already exists`);
      }
      entity.name = dto.name;
    }

    return await this.repo.save(entity);
  }

  /**
   * Delete tag:
   * - remueve las relaciones en la tabla join testimonios_tags (o testimonios_tags)
   * - elimina el tag
   */
  async delete(id: string) {
    const tag = await this.repo.findOneById(id);
    if (!tag) throw new NotFoundException('Tag not found');

    await this.repo.deleteRelations(id);
    await this.repo.deleteById(id);

    return { id };
  }
}
