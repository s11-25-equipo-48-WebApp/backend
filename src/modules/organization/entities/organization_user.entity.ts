import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "../../auth/entities/user.entity";
import { Role } from "./enums";

@Entity("organization_users")
export class OrganizationUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.organizations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Organization, (org) => org.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @Column({ type: "enum", enum: Role, default: Role.EDITOR })
  role: Role;

  @Column({ type: "boolean", default: false })
  is_active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
