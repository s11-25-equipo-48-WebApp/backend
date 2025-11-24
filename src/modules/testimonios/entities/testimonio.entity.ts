import { last } from 'rxjs';
import { Category } from 'src/modules/categories/entities/category.entity';

import { Status } from 'src/common/entities/enums';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('testimonios')
export class Testimonio {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @ManyToOne(() => Category)
  category: Category;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'testimonios_tags', // nombre de la tabla pivot
    joinColumn: { name: 'testimonio_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @Column({ type: 'text', nullable: true })
  media_url?: string | null;

  @Column({ type: 'varchar', length: 20 })
  media_type: 'image' | 'video' | 'none';

  @Column({ type: 'varchar', length: 255, nullable: true })
  author?: string | null;

  @Column({ type: 'uuid', nullable: true })
  author_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approved_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null;

  @Column({ type: 'varchar', length: 50, default: Status.PENDIENTE })
  status: Status.PENDIENTE | Status.APROBADO | Status.RECHAZADO;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
