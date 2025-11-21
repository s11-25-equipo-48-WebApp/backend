import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class TagsExist implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async validate(value: any, args: ValidationArguments) {
    if (value == null) return true; // nada que validar
    if (!Array.isArray(value)) return false;
    if (value.length === 0) return true;

    const foundTags = await this.tagRepository.findBy({ id: In(value) }); 
    return foundTags.length === value.length; 
  }

  defaultMessage(args: ValidationArguments) {
    return `One or more tags do not exist`;
  }
}
