import { last } from 'rxjs';
import { User } from 'src/modules/auth/entities/user.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Status } from 'src/modules/organization/entities/enums';
import { Organization } from 'src/modules/organization/entities/organization.entity';
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
  JoinColumn,
} from 'typeorm';

export enum StatusS {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

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

  @ManyToMany(() => Tag, (tag) => tag.testimonios, { eager: false })
  @JoinTable({
    name: 'testimonios_tags',
    joinColumn: { name: 'testimonio_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @Column({ type: 'text', nullable: true })
  media_url?: string | null;

  @Column({ type: 'varchar', length: 20 })
  media_type: 'image' | 'video' | 'none';

  @Column({ type: 'varchar', length: 255, nullable: true })
  author_name?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author_email?: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by_user_id?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  created_by_user: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approved_by?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null;

  @Column({ type: "enum", enum: StatusS, default: StatusS.PENDIENTE })
  status : StatusS;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;

  @ManyToOne(() => Organization, (org) => org.testimonios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

}
