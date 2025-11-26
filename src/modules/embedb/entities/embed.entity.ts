import { Organization } from "src/modules/organization/entities/organization.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('embeds')
export class Embed {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => Organization, (o) => o.embed)
  organizations: Organization[];

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'varchar' })
  theme!: string;

  @Column({ type: 'boolean', default: false })
  autoplay!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
