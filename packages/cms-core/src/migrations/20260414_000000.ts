import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_description" varchar;
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;

    ALTER TABLE "_projects_v" ADD COLUMN IF NOT EXISTS "version_meta_title" varchar;
    ALTER TABLE "_projects_v" ADD COLUMN IF NOT EXISTS "version_meta_description" varchar;
    ALTER TABLE "_projects_v" ADD COLUMN IF NOT EXISTS "version_meta_image_id" integer;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'projects_meta_image_id_media_id_fk'
      ) THEN
        ALTER TABLE "projects" ADD CONSTRAINT "projects_meta_image_id_media_id_fk"
          FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_projects_v_version_meta_image_id_media_id_fk'
      ) THEN
        ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_meta_image_id_media_id_fk"
          FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "projects_meta_meta_image_idx" ON "projects" USING btree ("meta_image_id");
    CREATE INDEX IF NOT EXISTS "_projects_v_version_meta_version_meta_image_idx" ON "_projects_v" USING btree ("version_meta_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "projects_meta_meta_image_idx";
    DROP INDEX IF EXISTS "_projects_v_version_meta_version_meta_image_idx";

    ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_meta_image_id_media_id_fk";
    ALTER TABLE "_projects_v" DROP CONSTRAINT IF EXISTS "_projects_v_version_meta_image_id_media_id_fk";

    ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_title";
    ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_description";
    ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_image_id";

    ALTER TABLE "_projects_v" DROP COLUMN IF EXISTS "version_meta_title";
    ALTER TABLE "_projects_v" DROP COLUMN IF EXISTS "version_meta_description";
    ALTER TABLE "_projects_v" DROP COLUMN IF EXISTS "version_meta_image_id";
  `)
}
