import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Testimonio } from '../testimonios/entities/testimonio.entity';

@Injectable()
export class CategoriesService {
  constructor(
  @InjectRepository(Category)
  private readonly repo: Repository<Category>,
  @InjectRepository(Testimonio)
  private readonly testimonioRepo: Repository<Testimonio>,
) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    // unicidad
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) {
      throw new BadRequestException(`Category with name "${dto.name}" already exists`);
    }

    const entity = this.repo.create({
      // id será generado por PrimaryGeneratedColumn; opcional pasar uuidv4()
      name: dto.name,
    } as Partial<Category>);

    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const entity = await this.repo.findOneById(id);
    if (!entity) throw new NotFoundException(`Category with id ${id} not found`);

    if (dto.name && dto.name !== entity.name) {
      const other = await this.repo.findOne({ where: { id } });
      if (other && other.id !== id) {
        throw new BadRequestException(`Category with name "${dto.name}" already exists`);
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
  async delete(id: string, reassignTo?: string) {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    // contar testimonios asociados
    const testimonios = await this.testimonioRepo.count({
      where: { category: { id } },
    });

    if (testimonios > 0) {
      if (!reassignTo) {
        throw new BadRequestException(
          `Category has ${testimonios} testimonios. Provide reassignTo.`,
        );
      }

      const dest = await this.repo.findOne({ where: { id: reassignTo } });
      if (!dest) throw new NotFoundException('Destination category not found');

      await this.testimonioRepo.update(
        { category: { id } },
        { category: dest },
      );
    }

    await this.repo.delete(id);
    return { id };
  }

  async findAll() {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }
}
