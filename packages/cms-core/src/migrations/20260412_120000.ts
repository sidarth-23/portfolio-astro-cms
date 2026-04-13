import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- CTA buttons enums
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_home_page_cta_buttons_variant') THEN
        CREATE TYPE "public"."enum_home_page_cta_buttons_variant" AS ENUM('default', 'primary', 'secondary', 'accent', 'outline', 'ghost');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_home_page_cta_buttons_link_type') THEN
        CREATE TYPE "public"."enum_home_page_cta_buttons_link_type" AS ENUM('custom', 'reference');
      END IF;
    END $$;

    -- Featured sections collection enum
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_home_page_featured_sections_collection') THEN
        CREATE TYPE "public"."enum_home_page_featured_sections_collection" AS ENUM('posts', 'projects');
      END IF;
    END $$;

    -- Create featured sections table (with collection column)
    CREATE TABLE IF NOT EXISTS "home_page_featured_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "description" jsonb,
      "collection" "public"."enum_home_page_featured_sections_collection" NOT NULL DEFAULT 'posts'
    );

    -- Create CTA buttons table
    CREATE TABLE IF NOT EXISTS "home_page_cta_buttons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "variant" "public"."enum_home_page_cta_buttons_variant" DEFAULT 'default' NOT NULL,
      "link_type" "public"."enum_home_page_cta_buttons_link_type" DEFAULT 'custom',
      "link_new_tab" boolean,
      "link_url" varchar
    );

    -- Foreign keys
    DO $$ BEGIN
      ALTER TABLE "home_page_featured_sections" ADD CONSTRAINT "home_page_featured_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "home_page_cta_buttons" ADD CONSTRAINT "home_page_cta_buttons_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    -- Indexes
    CREATE INDEX IF NOT EXISTS "home_page_featured_sections_order_idx" ON "home_page_featured_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "home_page_featured_sections_parent_id_idx" ON "home_page_featured_sections" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "home_page_cta_buttons_order_idx" ON "home_page_cta_buttons" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "home_page_cta_buttons_parent_id_idx" ON "home_page_cta_buttons" USING btree ("_parent_id");

    -- Ensure home_sections_summary exists on posts
    ALTER TABLE "posts"
      ADD COLUMN IF NOT EXISTS "home_sections_summary" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "home_page_featured_sections" CASCADE;
    DROP TABLE IF EXISTS "home_page_cta_buttons" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_home_page_featured_sections_collection";
    DROP TYPE IF EXISTS "public"."enum_home_page_cta_buttons_variant";
    DROP TYPE IF EXISTS "public"."enum_home_page_cta_buttons_link_type";

    ALTER TABLE "posts"
      DROP COLUMN IF EXISTS "home_sections_summary";
  `)
}
