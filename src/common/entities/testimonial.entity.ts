import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MediaType, Status } from "./enums";
import { User } from "./user.entity";
import { Category } from "./category.entity";
import { TestimonialTag } from "./testimonialTag.entity";
import { AnalyticsEvent } from "./analyticsEvent.entity";
import { Embed } from "./embed.entity";
import { Project } from "./projects.entity";

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: Status, default: Status.PENDIENTE })
  status!: Status;

  @Column({ type: 'enum', enum: MediaType, default: MediaType.NONE })
  media_type!: MediaType;

  @Column({ type: 'boolean', default: false })
  broken_media!: boolean;

  @ManyToOne(() => User, (u) => u.testimonials)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column('uuid')
  author_id!: string;

  @ManyToOne(() => Category, (c) => c.testimonials)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column('uuid')
  category_id!: string;

  @ManyToOne(() => Project, (p) => p.testimonials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => TestimonialTag, (tt) => tt.testimonial)
  tags!: TestimonialTag[];

  @OneToMany(() => AnalyticsEvent, (a) => a.testimonial)
  analytics!: AnalyticsEvent[];

  @OneToMany(() => Embed, (e) => e.testimonial)
  embeds!: Embed[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @Column({ type: 'tsvector', select: false, nullable: true })
  search_vector!: string;
}
