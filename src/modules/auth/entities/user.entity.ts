import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "./enums";
import { Testimonio } from "src/modules/testimonios/entities/testimonio.entity";
import { UserProfile } from "./userProfile.entity";
import { AuthToken } from "./authToken.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  password_hash!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  role!: Role;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at?: Date;

  @OneToOne(() => UserProfile, (p) => p.user)
  profile!: UserProfile;

  @OneToMany(() => Testimonio, (t) => t.author)
  testimonials!: Testimonio[];

  @OneToMany(() => AuthToken, (t) => t.user)
  tokens!: AuthToken[];

//   @OneToMany(() => Project, (project) => project.user)
//   projects!: Project[];
}
