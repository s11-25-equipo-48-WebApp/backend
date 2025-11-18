import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Testimonial } from "./testimonial.entity";
import { EventType } from "./enums";

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Testimonial, (t) => t.analytics)
  @JoinColumn({ name: 'testimonial_id' })
  testimonial: Testimonial;

  @Column('uuid')
  testimonial_id: string;

  @Column({ type: 'enum', enum: EventType })
  event_type: EventType;

  @Column({ type: 'timestamp' })
  occurred_at: Date;

  @Column()
  ip_address: string;

  @Column()
  user_agent: string;

  @Column()
  referrer: string;

  @Column({ type: 'jsonb', default: {} })
  device_info: any;
}
