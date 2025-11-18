import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TestimonialTag } from "./testimonialTag.entity";

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar' })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => TestimonialTag, (tt) => tt.tag)
  testimonialTags: TestimonialTag[];
}
