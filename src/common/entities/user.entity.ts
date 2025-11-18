import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "./enums";
import { UserProfile } from "./userProfile.entity";
import { Testimonial } from "./testimonial.entity";
import { AuthToken } from "./authToken.entity";
import { Project } from "./projects.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  role: Role;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at?: Date;

  @OneToOne(() => UserProfile, (p) => p.user)
  profile: UserProfile;

  @OneToMany(() => Testimonial, (t) => t.author)
  testimonials: Testimonial[];

  @OneToMany(() => AuthToken, (t) => t.user)
  tokens: AuthToken[];

  @OneToMany(() => Project, (project) => project.user)
  projects: Project[];
}
