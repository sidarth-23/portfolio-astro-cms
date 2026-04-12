import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fixes schema gaps left by the linkField redesign (20260413_150000):
 *
 * 1. home_page_rels was never given a series_id column, but the ctaButtons
 *    link.reference field now accepts posts | projects | series.
 *
 * 2. home_page_cta_buttons.link_type enum was created with only ('custom','reference')
 *    but the redesigned linkField has a third type: 'page'. The link_page column
 *    for storing the static page target was never added either.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ============================================================
    -- STEP 1: Add series_id to home_page_rels
    -- ============================================================

    ALTER TABLE "home_page_rels"
      ADD COLUMN IF NOT EXISTS "series_id" integer;

    DO $$ BEGIN
      ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_series_fk"
        FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "home_page_rels_series_id_idx"
      ON "home_page_rels" USING btree ("series_id");

    -- ============================================================
    -- STEP 2: Extend link_type enum with 'page' variant
    -- ============================================================

    ALTER TYPE "public"."enum_home_page_cta_buttons_link_type"
      ADD VALUE IF NOT EXISTS 'page';

    -- ============================================================
    -- STEP 3: Add link_page enum type and column to home_page_cta_buttons
    -- ============================================================

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_home_page_cta_buttons_link_page') THEN
        CREATE TYPE "public"."enum_home_page_cta_buttons_link_page"
          AS ENUM('home', 'blog', 'projects', 'cv', 'rss');
      END IF;
    END $$;

    ALTER TYPE "public"."enum_home_page_cta_buttons_link_page"
      ADD VALUE IF NOT EXISTS 'rss';

    ALTER TABLE "home_page_cta_buttons"
      ADD COLUMN IF NOT EXISTS "link_page" "public"."enum_home_page_cta_buttons_link_page";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove link_page column and enum
    ALTER TABLE "home_page_cta_buttons"
      DROP COLUMN IF EXISTS "link_page";

    DROP TYPE IF EXISTS "public"."enum_home_page_cta_buttons_link_page";

    -- Remove series_id from home_page_rels
    ALTER TABLE "home_page_rels" DROP CONSTRAINT IF EXISTS "home_page_rels_series_fk";
    DROP INDEX IF EXISTS "home_page_rels_series_id_idx";
    ALTER TABLE "home_page_rels" DROP COLUMN IF EXISTS "series_id";

    -- Note: removing 'page' from the link_type enum is not possible in PostgreSQL
    -- without recreating the type. Since no rows should use 'page' at this point,
    -- the enum is left as-is. A manual recreation would be needed if strictly required.
  `)
}
