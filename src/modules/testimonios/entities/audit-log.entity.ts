import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  testimonio_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id?: string | null;

  @Column({ type: 'varchar', length: 255 })
  user_name: string;

  @Column({ type: 'jsonb' })
  diff: Record<string, { before: any; after: any }>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
