import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Testimonio } from '../../testimonios/entities/testimonio.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @ManyToMany(() => Testimonio, (t) => (t as any).tags)
  testimonios: Testimonio[];
}
