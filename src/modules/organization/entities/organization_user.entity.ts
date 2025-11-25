import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Organization } from "./organization.entity";
import { Role } from "../../auth/entities/enums";
import { User } from "../../auth/entities/user.entity";

@Entity('organization_users')
@Unique(['user', 'organization'])
export class OrganizationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.organizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Organization, (org) => org.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @Column({ type: "enum", enum: Role, default: Role.EDITOR })
  role: Role;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}