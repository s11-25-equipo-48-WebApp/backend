import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('integration_logs')
export class IntegrationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column()
  operation: string;

  @Column({ type: 'jsonb', default: {} })
  request_payload: any;

  @Column({ type: 'jsonb', default: {} })
  response_payload: any;

  @Column({ type: 'int' })
  response_code: number;

  @Column({ default: false })
  success: boolean;

  @CreateDateColumn()
  created_at: Date;
}
