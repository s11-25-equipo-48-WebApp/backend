import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class CategoryExists implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async validate(value: any, args: ValidationArguments) {
    if (!value) return false;

    const category = await this.categoryRepository.findOne({ where: { id: value } });
    return !!category;
  }

  defaultMessage(args: ValidationArguments) {
    return `Category with id ${args.value} does not exist`;
  }
}
