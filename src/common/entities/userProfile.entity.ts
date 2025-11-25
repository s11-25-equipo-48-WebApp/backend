// import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
// import { User } from "./user.entity";

// @Entity('user_profiles')
// export class UserProfile {
//   @PrimaryColumn('uuid')
//   user_id!: string;

//   @OneToOne(() => User, (u) => u.profile, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'user_id' })
//   user!: User;

//   @Column({ type: 'varchar', nullable: true })
//   avatar_url!: string | null;

//   @Column({ type: 'text' })
//   bio!: string;

//   @Column({ type: 'jsonb', default: {} })
//   metadata: any;
// }
