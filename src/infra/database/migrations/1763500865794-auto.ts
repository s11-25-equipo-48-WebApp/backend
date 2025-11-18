import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1763500865794 implements MigrationInterface {
    name = 'Auto1763500865794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "testimonial_tags" ("testimonial_id" uuid NOT NULL, "tag_id" uuid NOT NULL, "added_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_db7cfa19cf5b6dfe130ee9cbbe1" PRIMARY KEY ("testimonial_id", "tag_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."analytics_events_event_type_enum" AS ENUM('view', 'click', 'share')`);
        await queryRunner.query(`CREATE TABLE "analytics_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "testimonial_id" uuid NOT NULL, "event_type" "public"."analytics_events_event_type_enum" NOT NULL, "occurred_at" TIMESTAMP NOT NULL, "ip_address" character varying NOT NULL, "user_agent" character varying NOT NULL, "referrer" character varying NOT NULL, "device_info" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_5d643d67a09b55653e98616f421" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "embeds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "testimonial_id" uuid NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "theme" character varying NOT NULL, "autoplay" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c44f5ea08993d1a72a9539693af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "user_id" uuid NOT NULL, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."testimonials_status_enum" AS ENUM('pendiente', 'aprobado', 'rechazado')`);
        await queryRunner.query(`CREATE TYPE "public"."testimonials_media_type_enum" AS ENUM('image', 'video', 'none')`);
        await queryRunner.query(`CREATE TABLE "testimonials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "body" text NOT NULL, "status" "public"."testimonials_status_enum" NOT NULL DEFAULT 'pendiente', "media_type" "public"."testimonials_media_type_enum" NOT NULL DEFAULT 'none', "broken_media" boolean NOT NULL DEFAULT false, "author_id" uuid NOT NULL, "category_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "search_vector" tsvector, "project_id" uuid, CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "refresh_token_hash" character varying(255) NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('visitor', 'editor', 'admin', 'superadmin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deactivated_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_profiles" ("user_id" uuid NOT NULL, "avatar_url" character varying, "bio" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_6ca9503d77ae39b4b5a6cc3ba88" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."media_assets_resource_type_enum" AS ENUM('image', 'video', 'none')`);
        await queryRunner.query(`CREATE TABLE "media_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "public_id" character varying NOT NULL, "secure_url" character varying NOT NULL, "resource_type" "public"."media_assets_resource_type_enum" NOT NULL, "mime_type" character varying NOT NULL, "size_bytes" integer NOT NULL, "uploaded_by" uuid NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ca47e9f67a5e5d8af1e75d66ee6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "integration_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying NOT NULL, "operation" character varying NOT NULL, "request_payload" jsonb NOT NULL DEFAULT '{}', "response_payload" jsonb NOT NULL DEFAULT '{}', "response_code" integer NOT NULL, "success" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_89ba1967bb4ac6c412901cf29a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "action" character varying NOT NULL, "target_type" character varying NOT NULL, "target_id" uuid NOT NULL, "diff" jsonb NOT NULL DEFAULT '{}', "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "testimonial_tags" ADD CONSTRAINT "FK_e16e38e005130ecd236b71ca1d7" FOREIGN KEY ("testimonial_id") REFERENCES "testimonials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "testimonial_tags" ADD CONSTRAINT "FK_455e8e4bfdb14c4628d623c4aa1" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_events" ADD CONSTRAINT "FK_125e463a5c095aaf7510f71ce84" FOREIGN KEY ("testimonial_id") REFERENCES "testimonials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "embeds" ADD CONSTRAINT "FK_c3796cf14b65d6a1cd764422a78" FOREIGN KEY ("testimonial_id") REFERENCES "testimonials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_bd55b203eb9f92b0c8390380010" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD CONSTRAINT "FK_fe6fd78ea5cc143bf0a255aa70f" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD CONSTRAINT "FK_19c046d52add1add9e2ab535d83" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "testimonials" ADD CONSTRAINT "FK_21bc80cfcfb1ddcf5f650ca70cc" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media_assets" ADD CONSTRAINT "FK_b8909597cf71b1748f5cc37b675" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "media_assets" DROP CONSTRAINT "FK_b8909597cf71b1748f5cc37b675"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP CONSTRAINT "FK_21bc80cfcfb1ddcf5f650ca70cc"`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP CONSTRAINT "FK_19c046d52add1add9e2ab535d83"`);
        await queryRunner.query(`ALTER TABLE "testimonials" DROP CONSTRAINT "FK_fe6fd78ea5cc143bf0a255aa70f"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_bd55b203eb9f92b0c8390380010"`);
        await queryRunner.query(`ALTER TABLE "embeds" DROP CONSTRAINT "FK_c3796cf14b65d6a1cd764422a78"`);
        await queryRunner.query(`ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_125e463a5c095aaf7510f71ce84"`);
        await queryRunner.query(`ALTER TABLE "testimonial_tags" DROP CONSTRAINT "FK_455e8e4bfdb14c4628d623c4aa1"`);
        await queryRunner.query(`ALTER TABLE "testimonial_tags" DROP CONSTRAINT "FK_e16e38e005130ecd236b71ca1d7"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "integration_logs"`);
        await queryRunner.query(`DROP TABLE "media_assets"`);
        await queryRunner.query(`DROP TYPE "public"."media_assets_resource_type_enum"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TABLE "testimonials"`);
        await queryRunner.query(`DROP TYPE "public"."testimonials_media_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."testimonials_status_enum"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "embeds"`);
        await queryRunner.query(`DROP TABLE "analytics_events"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_events_event_type_enum"`);
        await queryRunner.query(`DROP TABLE "testimonial_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
