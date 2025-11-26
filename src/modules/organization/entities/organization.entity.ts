import { Testimonio } from "src/modules/testimonios/entities/testimonio.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationUser } from "./organization_user.entity";
import { Category } from "src/modules/categories/entities/category.entity";
import { Tag } from "src/modules/tags/entities/tag.entity"; // Importar Tag

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

  @OneToMany(() => Category, (c) => c.organization)
  categories: Category[];

  @OneToMany(() => Tag, (t) => t.organization) // Añadir relación OneToMany para Tag
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;
}
