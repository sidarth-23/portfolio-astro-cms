import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF NOT EXISTS (
     SELECT 1
     FROM pg_type
     WHERE typname = 'enum_cv_page_sections_items_item_type'
    ) THEN
     CREATE TYPE "public"."enum_cv_page_sections_items_item_type" AS ENUM('generic', 'organizationRole', 'linked');
    END IF;
   END $$;
    ALTER TABLE "cv_page_sections_items" ADD COLUMN IF NOT EXISTS "item_type" "enum_cv_page_sections_items_item_type" DEFAULT 'generic' NOT NULL;
    ALTER TABLE "cv_page_sections_items" ADD COLUMN IF NOT EXISTS "start_month" timestamp(3) with time zone;
    ALTER TABLE "cv_page_sections_items" ADD COLUMN IF NOT EXISTS "end_month" timestamp(3) with time zone;
    ALTER TABLE "cv_page_sections_items" ADD COLUMN IF NOT EXISTS "organization" varchar;
    ALTER TABLE "cv_page_sections_items" ADD COLUMN IF NOT EXISTS "location" varchar;
    ALTER TABLE "cv_page_sections_items" ADD COLUMN IF NOT EXISTS "url" varchar;
    UPDATE "cv_page_sections_items" SET "item_type" = 'generic' WHERE "item_type" IS NULL;
    ALTER TABLE "cv_page_sections_items" ALTER COLUMN "item_type" SET DEFAULT 'generic';
    ALTER TABLE "cv_page_sections_items" ALTER COLUMN "item_type" SET NOT NULL;
    ALTER TABLE "cv_page_sections_items" ALTER COLUMN "start_month" TYPE timestamp(3) with time zone USING NULLIF("start_month"::text, '')::timestamp(3) with time zone;
    ALTER TABLE "cv_page_sections_items" ALTER COLUMN "end_month" TYPE timestamp(3) with time zone USING NULLIF("end_month"::text, '')::timestamp(3) with time zone;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cv_page_sections_items" DROP COLUMN IF EXISTS "item_type";
   ALTER TABLE "cv_page_sections_items" DROP COLUMN IF EXISTS "start_month";
   ALTER TABLE "cv_page_sections_items" DROP COLUMN IF EXISTS "end_month";
   ALTER TABLE "cv_page_sections_items" DROP COLUMN IF EXISTS "organization";
   ALTER TABLE "cv_page_sections_items" DROP COLUMN IF EXISTS "location";
   ALTER TABLE "cv_page_sections_items" DROP COLUMN IF EXISTS "url";
   DROP TYPE IF EXISTS "public"."enum_cv_page_sections_items_item_type";
  `)
}
