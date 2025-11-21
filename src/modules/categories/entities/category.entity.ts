import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Testimonio } from '../../testimonios/entities/testimonio.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @OneToMany(() => Testimonio, (t) => (t as any).category)
  testimonios: Testimonio[];
}
