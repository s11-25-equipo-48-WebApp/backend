import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateTagDto } from './dto/CreateTagDto';
import { UpdateTagDto } from './dto/UpdateTagDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { RequestWithUser } from 'src/common/interfaces/RequestWithUser';
import { Organization } from 'src/modules/organization/entities/organization.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ){}

  async create(dto: CreateTagDto, user: RequestWithUser['user']) {
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Se requiere una organización para crear tags.');
    }

    const organization = await this.organizationRepo.findOneBy({ id: user.organizationId });
    if (!organization) {
      throw new BadRequestException(`Organización con ID ${user.organizationId} no encontrada.`);
    }

    const exists = await this.repo.findOne({ where: { name: dto.name, organization: { id: user.organizationId } } });
    if (exists) throw new BadRequestException('Tag already exists in this organization');

    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');

    const tag = this.repo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      organization: organization,
    });

    return this.repo.save(tag);
  }

  async findAll(user: RequestWithUser['user']) {
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Se requiere una organización para listar tags.');
    }
    return this.repo.find({
      where: { organization: { id: user.organizationId } },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string, user: RequestWithUser['user']) {
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Se requiere una organización para ver este tag.');
    }
    const tag = await this.repo.findOne({ where: { id, organization: { id: user.organizationId } } });
    if (!tag) throw new NotFoundException('Tag not found in your organization');
    return tag;
  }

  async update(id: string, dto: UpdateTagDto, user: RequestWithUser['user']) {
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Se requiere una organización para actualizar tags.');
    }
    const tag = await this.findOne(id, user); // findOne ya valida la organización

    if (dto.name) {
      const exists = await this.repo.findOne({ where: { name: dto.name, organization: { id: user.organizationId } } });
      if (exists && exists.id !== id)
        throw new BadRequestException('Name already in use in this organization');

      tag.name = dto.name;
      tag.slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    }

    if (dto.description !== undefined) tag.description = dto.description;

    return this.repo.save(tag);
  }

  async delete(id: string, user: RequestWithUser['user']) {
    if (!user || !user.organizationId) {
      throw new UnauthorizedException('Se requiere una organización para eliminar tags.');
    }
    const tag = await this.findOne(id, user); // findOne ya valida la organización
    await this.repo.remove(tag);
    return { id };
  }
}
