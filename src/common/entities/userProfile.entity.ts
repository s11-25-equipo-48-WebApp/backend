import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { Column } from "typeorm/browser";

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, (u) => u.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  avatar_url: string;

  @Column({ type: 'text' })
  bio: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: any;
}
