import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Testimonio } from '../../testimonios/entities/testimonio.entity';
import { Organization } from 'src/modules/organization/entities/organization.entity';

@Entity('tags')
@Unique(['name', 'organization'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Organization, (org) => org.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToMany(() => Testimonio, (t) => t.tags)
  testimonios: Testimonio[];
}
