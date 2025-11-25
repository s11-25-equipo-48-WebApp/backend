// import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { User } from "./user.entity";

// @Entity('audit_logs')
// export class AuditLog {
//   @PrimaryGeneratedColumn('uuid')
//   id!: string;

//   @Column('uuid')
//   user_id!: string;

//   @ManyToOne(() => User)
//   @JoinColumn({ name: 'user_id' })
//   user!: User;

//   @Column({ type: 'varchar' })
//   action!: string;

//   @Column({ type: 'varchar' })
//   target_type!: string;

//   @Column('uuid')
//   target_id!: string;

//   @Column({ type: 'jsonb', default: {} })
//   diff: any;

//   @Column({ type: 'text', nullable: true })
//   comment!: string;

//   @CreateDateColumn()
//   created_at!: Date;
// }
