import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique } from 'typeorm';
import { Testimonio } from '../../testimonios/entities/testimonio.entity';

@Entity('tags')
@Unique(['name'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => Testimonio, (t) => t.tags)
  testimonios: Testimonio[];
}