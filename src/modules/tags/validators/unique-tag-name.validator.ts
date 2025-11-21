import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueTagName implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
  ) {}

  async validate(value: any, args: ValidationArguments) {
    if (!value) return false;
    const found = await this.repo.findOne({ where: { name: value } });
    return !found;
  }

  defaultMessage(args: ValidationArguments) {
    return `Tag name "${args.value}" is already in use`;
  }
}
