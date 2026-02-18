import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "site_settings"
      ADD COLUMN IF NOT EXISTS "profile_image_id" integer;

    ALTER TABLE IF EXISTS "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_profile_image_id_media_id_fk";

    ALTER TABLE IF EXISTS "site_settings"
      ADD CONSTRAINT "site_settings_profile_image_id_media_id_fk"
      FOREIGN KEY ("profile_image_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "site_settings_profile_image_idx"
      ON "site_settings" USING btree ("profile_image_id");

    ALTER TABLE IF EXISTS "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_default_og_image_id_media_id_fk";

    DROP INDEX IF EXISTS "site_settings_default_og_image_idx";

    ALTER TABLE IF EXISTS "site_settings"
      DROP COLUMN IF EXISTS "site_title",
      DROP COLUMN IF EXISTS "site_description",
      DROP COLUMN IF EXISTS "default_og_image_id";

    ALTER TABLE IF EXISTS "projects"
      ADD COLUMN IF NOT EXISTS "github_url" varchar;

    ALTER TABLE IF EXISTS "_projects_v"
      ADD COLUMN IF NOT EXISTS "version_github_url" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "projects"
      DROP COLUMN IF EXISTS "github_url";

    ALTER TABLE IF EXISTS "_projects_v"
      DROP COLUMN IF EXISTS "version_github_url";

    ALTER TABLE IF EXISTS "site_settings"
      ADD COLUMN IF NOT EXISTS "site_title" varchar,
      ADD COLUMN IF NOT EXISTS "site_description" varchar,
      ADD COLUMN IF NOT EXISTS "default_og_image_id" integer;

    ALTER TABLE IF EXISTS "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_default_og_image_id_media_id_fk";

    ALTER TABLE IF EXISTS "site_settings"
      ADD CONSTRAINT "site_settings_default_og_image_id_media_id_fk"
      FOREIGN KEY ("default_og_image_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "site_settings_default_og_image_idx"
      ON "site_settings" USING btree ("default_og_image_id");

    ALTER TABLE IF EXISTS "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_profile_image_id_media_id_fk";

    DROP INDEX IF EXISTS "site_settings_profile_image_idx";

    ALTER TABLE IF EXISTS "site_settings"
      DROP COLUMN IF EXISTS "profile_image_id";
  `);
}
