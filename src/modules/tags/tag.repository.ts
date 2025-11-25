import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Tag } from "./entities/tag.entity";


@Injectable()
export class TagRepository extends Repository<Tag> {
  constructor(private dataSource: DataSource) {
    super(Tag, dataSource.createEntityManager());
  }

  findByName(name: string) {
    return this.findOne({ where: { name } });
  }

  findBySlug(slug: string) {
    return this.findOne({ where: { slug } });
  }
}