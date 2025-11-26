import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Testimonio } from '../testimonios/entities/testimonio.entity';
import { RequestWithUser } from 'src/common/interfaces/RequestWithUser';
import { Organization } from 'src/modules/organization/entities/organization.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    @InjectRepository(Testimonio)
    private readonly testimonioRepo: Repository<Testimonio>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  async create(dto: CreateCategoryDto, user: RequestWithUser['user']): Promise<Category> {
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('Se requiere una organización para crear categorías.');
    }

    const organization = await this.organizationRepo.findOneBy({ id: user.organization.id });
    if (!organization) {
      throw new BadRequestException(`Organización con ID ${user.organization.id} no encontrada.`);
    }

    // unicidad dentro de la organización
    const exists = await this.repo.findOne({ where: { name: dto.name, organization: { id: user.organization.id } } });
    if (exists) {
      throw new BadRequestException(`Category with name "${dto.name}" already exists in this organization`);
    }

    const entity = this.repo.create({
      name: dto.name,
      organization: organization,
    });

    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCategoryDto, user: RequestWithUser['user']): Promise<Category> {
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('Se requiere una organización para actualizar categorías.');
    }

    const entity = await this.repo.findOne({ where: { id, organization: { id: user.organization.id } } });
    if (!entity) throw new NotFoundException(`Category with id ${id} not found in your organization`);

    if (dto.name && dto.name !== entity.name) {
      const other = await this.repo.findOne({ where: { name: dto.name, organization: { id: user.organization.id } } });
      if (other && other.id !== id) {
        throw new BadRequestException(`Category with name "${dto.name}" already exists in this organization`);
      }
      entity.name = dto.name;
    }

    return await this.repo.save(entity);
  }

  /**
   * Elimina una categoría.
   * - Si hay testimonios asociados y NO se pasa reassignTo -> falla.
   * - Si se pasa reassignTo (id de otra categoría), reasigna testimonios y luego elimina.
   */
  async delete(id: string, user: RequestWithUser['user'], reassignTo?: string) {
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('Se requiere una organización para eliminar categorías.');
    }

    const category = await this.repo.findOne({ where: { id, organization: { id: user.organization.id } } });
    if (!category) throw new NotFoundException('Category not found in your organization');

    // contar testimonios asociados
    const testimonios = await this.testimonioRepo.count({
      where: { category: { id }, organization: { id: user.organization.id } },
    });

    if (testimonios > 0) {
      if (!reassignTo) {
        throw new BadRequestException(
          `Category has ${testimonios} testimonios. Provide reassignTo.`,
        );
      }

      const dest = await this.repo.findOne({ where: { id: reassignTo, organization: { id: user.organization.id } } });
      if (!dest) throw new NotFoundException('Destination category not found in your organization');

      await this.testimonioRepo.update(
        { category: { id }, organization: { id: user.organization.id } },
        { category: dest },
      );
    }

    await this.repo.delete({ id, organization: { id: user.organization.id } });
    return { id };
  }

  async findAll(user: RequestWithUser['user']) {
    if (!user || !user.organization?.id) {
      throw new UnauthorizedException('Se requiere una organización para listar categorías.');
    }
    return this.repo.find({
      where: { organization: { id: user.organization.id } },
      order: { name: 'ASC' },
    });
  }
}
