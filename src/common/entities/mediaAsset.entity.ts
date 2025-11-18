import express from "express";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { MediaType } from "./enums";

@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  public_id: string;

  @Column()
  secure_url: string;

  @Column({ type: 'enum', enum: MediaType })
  resource_type: express.MediaType;

  @Column()
  mime_type: string;

  @Column({ type: 'int' })
  size_bytes: number;

  @Column('uuid')
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  user: User;

  @CreateDateColumn()
  uploaded_at: Date;
}
