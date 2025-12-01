import { Testimonio } from "src/modules/testimonios/entities/testimonio.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationUser } from "./organization_user.entity";
import { Category } from "src/modules/categories/entities/category.entity";
import { Tag } from "src/modules/tags/entities/tag.entity"; // Importar Tag
import { Embed } from "src/modules/embedb/entities/embed.entity";

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => OrganizationUser, (ou) => ou.organization)
  members: OrganizationUser[];

  @OneToMany(() => Testimonio, (t) => t.organization)
  testimonios: Testimonio[];

  @OneToMany(() => Category, (c) => c.organization)
  categories: Category[];

  @OneToMany(() => Tag, (t) => t.organization)
  tags: Tag[];

  @OneToOne(() => Embed, (e) => e.organizations)
  @JoinColumn({ name: 'embed_id' }) 
  embed: Embed;

  @CreateDateColumn()
  createdAt: Date;
}
