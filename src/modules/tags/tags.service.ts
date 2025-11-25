import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/CreateTagDto';
import { UpdateTagDto } from './dto/UpdateTagDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
  ){}

  async create(dto: CreateTagDto) {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Tag already exists');

    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');

    const tag = this.repo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
    });

    return this.repo.save(tag);
  }

  async findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException();
    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.findOne(id);

    if (dto.name) {
      const exists = await this.repo.findOne({ where: { name: dto.name } });
      if (exists && exists.id !== id)
        throw new BadRequestException('Name already in use');

      tag.name = dto.name;
      tag.slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    }

    if (dto.description !== undefined) tag.description = dto.description;

    return this.repo.save(tag);
  }

  async delete(id: string) {
    const tag = await this.findOne(id);
    await this.repo.remove(tag);
    return { id };
  }
}
