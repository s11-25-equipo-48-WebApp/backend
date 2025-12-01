import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
  ) { }

  async create(dto: CreateCategoryDto, user: RequestWithUser['user'], organizationId: string): Promise<Category> {
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!user || !userOrg) {
      throw new UnauthorizedException('No autorizado para crear categorías en esta organización.');
    }

    const organization = await this.organizationRepo.findOneBy({ id: organizationId });
    if (!organization) {
      throw new BadRequestException(`Organización con ID ${organizationId} no encontrada.`);
    }

    // unicidad dentro de la organización
    const exists = await this.repo.findOne({ where: { name: dto.name, organization: { id: organizationId } } });
    if (exists) {
      throw new BadRequestException(`Category with name "${dto.name}" already exists in this organization`);
    }

    const entity = this.repo.create({
      name: dto.name,
      organization: organization,
    });

    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCategoryDto, user: RequestWithUser['user'], organizationId: string): Promise<Category> {
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!user || !userOrg) {
      throw new UnauthorizedException('No autorizado para actualizar categorías en esta organización.');
    }

    const entity = await this.repo.findOne({ where: { id, organization: { id: organizationId } } });
    if (!entity) throw new NotFoundException(`Category with id ${id} not found in your organization`);

    if (dto.name && dto.name !== entity.name) {
      const other = await this.repo.findOne({ where: { name: dto.name, organization: { id: organizationId } } });
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
  async delete(id: string, user: RequestWithUser['user'], organizationId: string, reassignTo?: string) {
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!user || !userOrg) {
      throw new UnauthorizedException('No autorizado para eliminar categorías en esta organización.');
    }

    const category = await this.repo.findOne({ where: { id, organization: { id: organizationId } } });
    if (!category) throw new NotFoundException('Category not found in your organization');

    // contar testimonios asociados
    const testimonios = await this.testimonioRepo.count({
      where: { category: { id }, organization: { id: organizationId } },
    });

    if (testimonios > 0) {
      if (!reassignTo) {
        throw new BadRequestException(
          `Category has ${testimonios} testimonios. Provide reassignTo.`,
        );
      }

      const dest = await this.repo.findOne({ where: { id: reassignTo, organization: { id: organizationId } } });
      if (!dest) throw new NotFoundException('Destination category not found in your organization');

      await this.testimonioRepo.update(
        { category: { id }, organization: { id: organizationId } },
        { category: dest },
      );
    }

    await this.repo.delete({ id, organization: { id: organizationId } });
    return { id };
  }

  async findAll(user: RequestWithUser['user'], organizationId: string) {
    // Validar autorización del usuario
    const userOrg = user.organizations.find(org => org.id === organizationId);
    if (!user || !userOrg) {
      throw new UnauthorizedException('No autorizado para listar categorías de esta organización.');
    }

    // Obtener todas las categorías de la organización
    const categories = await this.repo.find({
      where: { organization: { id: organizationId } },
      order: { name: 'ASC' },
    });

    // Para cada categoría, contar testimonios (solo los no eliminados)
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await this.testimonioRepo.count({
          where: {
            category: { id: category.id },
            organization: { id: organizationId },
            deleted_at: IsNull(),
          },
        });

        return {
          id: category.id,
          name: category.name,
          usage_count: count,
          created_at: category.createdAt,
        };
      })
    );

    return categoriesWithCount;
  }
}
