import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Testimonial } from "./testimonial.entity";
import { Tag } from "./tag.entity";

@Entity('testimonial_tags')
export class TestimonialTag {
  @PrimaryColumn('uuid')
  testimonial_id!: string;

  @PrimaryColumn('uuid')
  tag_id!: string;

  @ManyToOne(() => Testimonial, (t) => t.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testimonial_id' })
  testimonial!: Testimonial;

  @ManyToOne(() => Tag, (tag) => tag.testimonialTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;

  @CreateDateColumn()
  added_at!: Date;
}
