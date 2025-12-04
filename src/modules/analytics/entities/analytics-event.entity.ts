import { Organization } from 'src/modules/organization/entities/organization.entity';
import { Testimonio } from 'src/modules/testimonios/entities/testimonio.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

export enum EventType {
    VIEW = 'view',
    SUBMISSION = 'submission',
    APPROVAL = 'approval',
    REJECTION = 'rejection',
    CONSENT_GIVEN = 'consent_given',
    CONSENT_REVOKED = 'consent_revoked',
}

@Entity('analytics_events')
export class AnalyticsEvent {
    @PrimaryColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 50,
        enum: EventType,
    })
    event_type: EventType;

    @Column({ type: 'uuid', nullable: true })
    testimonio_id?: string | null;

    @Column({ type: 'uuid' })
    organization_id: string;

    @Column({ type: 'uuid', nullable: true })
    user_id?: string | null;

    @Column({ type: 'varchar', length: 45, nullable: true })
    ip_address?: string | null;

    @Column({ type: 'text', nullable: true })
    referrer?: string | null;

    @Column({ type: 'text', nullable: true })
    user_agent?: string | null;

    @Column({ type: 'jsonb', nullable: true })
    device_data?: Record<string, any> | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any> | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => Testimonio, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'testimonio_id' })
    testimonio?: Testimonio | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User | null;
}
