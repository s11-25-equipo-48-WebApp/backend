import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueCategoryName implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async validate(value: any, args: ValidationArguments) {
    if (!value) return false;
    const found = await this.repo.findOne({ where: { name: value } });
    return !found;
  }

  defaultMessage(args: ValidationArguments) {
    return `Category name "${args.value}" is already in use`;
  }
}
