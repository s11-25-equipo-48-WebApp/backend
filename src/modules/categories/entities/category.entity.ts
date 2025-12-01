import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, Unique, CreateDateColumn } from 'typeorm';
import { Testimonio } from '../../testimonios/entities/testimonio.entity';
import { Organization } from 'src/modules/organization/entities/organization.entity';

@Entity('categories')
@Unique(['name', 'organization'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ManyToOne(() => Organization, (org) => org.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Testimonio, (t) => (t as any).category)
  testimonios: Testimonio[];

  @CreateDateColumn()
  createdAt: Date;
}
