import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  user_id: string;

  @Column()
  refresh_token_hash: string;

  @Column({ type: 'timestamp' })
  issued_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  revoked: boolean;
}
