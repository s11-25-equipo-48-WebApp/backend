import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventType } from "./enums";

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /*@ManyToOne(() => Testimonial, (t) => t.analytics)
  @JoinColumn({ name: 'testimonial_id' })
  testimonial!: Testimonial;*/

  @Column('uuid')
  testimonial_id!: string;

  @Column({ type: 'enum', enum: EventType })
  event_type!: EventType;

  @Column({ type: 'timestamp' })
  occurred_at!: Date;

  @Column({ type: 'varchar' })
  ip_address!: string;

  @Column({ type: 'varchar' })
  user_agent!: string;

  @Column({ type: 'varchar' })
  referrer!: string;

  @Column({ type: 'jsonb', default: {} })
  device_info: any;
}
