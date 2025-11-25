// import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { User } from "./user.entity";

// @Entity("auth_tokens")
// export class AuthToken {
//   @PrimaryGeneratedColumn("uuid")
//   id!: string;

//   @Column({ type: "varchar", length: 255 })
//   refresh_token_hash!: string;

//   @Column({ type: "boolean", default: false })
//   revoked!: boolean;

//   @Column({ type: "uuid" })
//   user_id!: string;

//   @ManyToOne(() => User, (user) => user.tokens, { onDelete: "CASCADE" })
//   @JoinColumn({ name: "user_id" })
//   user!: User;

//   @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
//   created_at!: Date;

//   @Column({ type: "timestamp", nullable: true })
//   expires_at!: Date | null;
// }