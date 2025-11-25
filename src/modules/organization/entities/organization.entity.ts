import { Testimonio } from "src/modules/testimonios/entities/testimonio.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationUser } from "./organization_user.entity";

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => OrganizationUser, (ou) => ou.organization)
  members: OrganizationUser[];

  @OneToMany(() => Testimonio, (t) => t.organization)
  testimonios: Testimonio[];

  @CreateDateColumn()
  createdAt: Date;
}