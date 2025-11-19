import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Testimonial } from "./testimonial.entity";

@Entity('embeds')
export class Embed {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Testimonial, (t) => t.embeds)
  @JoinColumn({ name: 'testimonial_id' })
  testimonial!: Testimonial;

  @Column('uuid')
  testimonial_id!: string;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'varchar' })
  theme!: string;

  @Column({ type: 'boolean', default: false })
  autoplay!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
