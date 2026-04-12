import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ============================================================
    -- STEP 1: Enum types for new link fields
    -- ============================================================

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_projects_links_type') THEN
        CREATE TYPE "public"."enum_projects_links_type" AS ENUM('custom', 'reference', 'page');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_projects_links_page') THEN
        CREATE TYPE "public"."enum_projects_links_page" AS ENUM('home', 'blog', 'projects', 'cv');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__projects_v_version_links_type') THEN
        CREATE TYPE "public"."enum__projects_v_version_links_type" AS ENUM('custom', 'reference', 'page');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__projects_v_version_links_page') THEN
        CREATE TYPE "public"."enum__projects_v_version_links_page" AS ENUM('home', 'blog', 'projects', 'cv');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_links_type') THEN
        CREATE TYPE "public"."enum_users_links_type" AS ENUM('custom', 'reference', 'page');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_links_page') THEN
        CREATE TYPE "public"."enum_users_links_page" AS ENUM('home', 'blog', 'projects', 'cv');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_site_settings_sidebar_footer_items_link_type') THEN
        CREATE TYPE "public"."enum_site_settings_sidebar_footer_items_link_type" AS ENUM('custom', 'reference', 'page');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_site_settings_sidebar_footer_items_page') THEN
        CREATE TYPE "public"."enum_site_settings_sidebar_footer_items_page" AS ENUM('home', 'blog', 'projects', 'cv');
      END IF;
    END $$;

    -- ============================================================
    -- STEP 2: Create new projects_links array table
    -- ============================================================

    CREATE TABLE IF NOT EXISTS "projects_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon" varchar,
      "type" "public"."enum_projects_links_type" DEFAULT 'custom',
      "url" varchar,
      "page" "public"."enum_projects_links_page",
      "new_tab" boolean
    );

    -- Create _projects_v_version_links array table
    CREATE TABLE IF NOT EXISTS "_projects_v_version_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "_uuid" varchar,
      "icon" varchar,
      "type" "public"."enum__projects_v_version_links_type" DEFAULT 'custom',
      "url" varchar,
      "page" "public"."enum__projects_v_version_links_page",
      "new_tab" boolean
    );

    -- ============================================================
    -- STEP 3: Create new users_links array table
    -- ============================================================

    CREATE TABLE IF NOT EXISTS "users_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon" varchar,
      "type" "public"."enum_users_links_type" DEFAULT 'custom',
      "url" varchar,
      "page" "public"."enum_users_links_page",
      "new_tab" boolean
    );

    -- ============================================================
    -- STEP 4: Create rels tables for polymorphic reference fields
    -- ============================================================

    CREATE TABLE IF NOT EXISTS "projects_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer,
      "projects_id" integer,
      "series_id" integer
    );

    CREATE TABLE IF NOT EXISTS "_projects_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer,
      "projects_id" integer,
      "series_id" integer
    );

    CREATE TABLE IF NOT EXISTS "users_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer,
      "projects_id" integer,
      "series_id" integer
    );

    -- site_settings_rels for sidebarFooterItems reference field
    CREATE TABLE IF NOT EXISTS "site_settings_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer,
      "projects_id" integer,
      "series_id" integer
    );

    -- ============================================================
    -- STEP 5: Foreign key constraints for new tables
    -- ============================================================

    DO $$ BEGIN
      ALTER TABLE "projects_links" ADD CONSTRAINT "projects_links_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_projects_v_version_links" ADD CONSTRAINT "_projects_v_version_links_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_links" ADD CONSTRAINT "users_links_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_posts_fk"
        FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_projects_fk"
        FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_series_fk"
        FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_posts_fk"
        FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_projects_fk"
        FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_series_fk"
        FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_posts_fk"
        FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_projects_fk"
        FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_series_fk"
        FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_posts_fk"
        FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_projects_fk"
        FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_series_fk"
        FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    -- ============================================================
    -- STEP 6: Indexes for new tables
    -- ============================================================

    CREATE INDEX IF NOT EXISTS "projects_links_order_idx" ON "projects_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "projects_links_parent_id_idx" ON "projects_links" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "_projects_v_version_links_order_idx" ON "_projects_v_version_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_projects_v_version_links_parent_id_idx" ON "_projects_v_version_links" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "users_links_order_idx" ON "users_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_links_parent_id_idx" ON "users_links" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "projects_rels_path_idx" ON "projects_rels" USING btree ("path");

    CREATE INDEX IF NOT EXISTS "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");

    CREATE INDEX IF NOT EXISTS "users_rels_order_idx" ON "users_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "users_rels_path_idx" ON "users_rels" USING btree ("path");

    CREATE INDEX IF NOT EXISTS "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");

    -- ============================================================
    -- STEP 7: Data migration — run BEFORE dropping old columns
    -- ============================================================

    -- Migrate projects.github_url → projects_links
    INSERT INTO "projects_links" ("icon", "url", "new_tab", "_order", "_parent_id", "id")
    SELECT
      'si:github',
      "github_url",
      true,
      0,
      "id",
      gen_random_uuid()::varchar
    FROM "projects"
    WHERE "github_url" IS NOT NULL AND btrim("github_url") != '';

    -- Migrate _projects_v.version_github_url → _projects_v_version_links
    INSERT INTO "_projects_v_version_links" ("icon", "url", "new_tab", "_order", "_parent_id", "id")
    SELECT
      'si:github',
      "version_github_url",
      true,
      0,
      "id",
      gen_random_uuid()::varchar
    FROM "_projects_v"
    WHERE "version_github_url" IS NOT NULL AND btrim("version_github_url") != '';

    -- Migrate users.linked_in_url → users_links (_order = 0)
    INSERT INTO "users_links" ("icon", "url", "new_tab", "_order", "_parent_id", "id")
    SELECT
      'si:linkedin',
      "linked_in_url",
      true,
      0,
      "id",
      gen_random_uuid()::varchar
    FROM "users"
    WHERE "linked_in_url" IS NOT NULL AND btrim("linked_in_url") != '';

    -- Migrate users.github_url → users_links (_order = 1)
    INSERT INTO "users_links" ("icon", "url", "new_tab", "_order", "_parent_id", "id")
    SELECT
      'si:github',
      "github_url",
      true,
      1,
      "id",
      gen_random_uuid()::varchar
    FROM "users"
    WHERE "github_url" IS NOT NULL AND btrim("github_url") != '';

    -- Map old site_settings_sidebar_footer_items.type enum to icon strings
    -- (Add new columns first, then populate them from old data)
    ALTER TABLE "site_settings_sidebar_footer_items"
      ADD COLUMN IF NOT EXISTS "icon" varchar;

    ALTER TABLE "site_settings_sidebar_footer_items"
      ADD COLUMN IF NOT EXISTS "new_tab" boolean;

    ALTER TABLE "site_settings_sidebar_footer_items"
      ADD COLUMN IF NOT EXISTS "page" "public"."enum_site_settings_sidebar_footer_items_page";

    UPDATE "site_settings_sidebar_footer_items"
    SET "icon" = CASE "type"::text
      WHEN 'github'        THEN 'si:github'
      WHEN 'linkedin'      THEN 'si:linkedin'
      WHEN 'email'         THEN 'ph:envelope'
      WHEN 'rss'           THEN 'ph:rss'
      WHEN 'facebook'      THEN 'si:facebook'
      WHEN 'twitter'       THEN 'si:x'
      WHEN 'dribbble'      THEN 'si:dribbble'
      WHEN 'instagram'     THEN 'si:instagram'
      WHEN 'youtube'       THEN 'si:youtube'
      WHEN 'twitch'        THEN 'si:twitch'
      WHEN 'tiktok'        THEN 'si:tiktok'
      WHEN 'medium'        THEN 'si:medium'
      WHEN 'whatsapp'      THEN 'si:whatsapp'
      WHEN 'telegram'      THEN 'si:telegram'
      WHEN 'discord'       THEN 'si:discord'
      WHEN 'reddit'        THEN 'si:reddit'
      WHEN 'pinterest'     THEN 'si:pinterest'
      WHEN 'behance'       THEN 'si:behance'
      WHEN 'codepen'       THEN 'si:codepen'
      WHEN 'gitlab'        THEN 'si:gitlab'
      WHEN 'stackoverflow' THEN 'si:stackoverflow'
      WHEN 'devto'         THEN 'si:devto'
      ELSE NULL
    END;

    -- For rss type, set url to /rss.xml if url is null/empty
    UPDATE "site_settings_sidebar_footer_items"
    SET "url" = '/rss.xml'
    WHERE "type"::text = 'rss'
      AND ("url" IS NULL OR btrim("url") = '');

    -- ============================================================
    -- STEP 8: Alter site_settings_sidebar_footer_items.type column
    --         Change from old platform enum to new link-type varchar
    -- ============================================================

    -- Drop the old enum constraint by changing column type to varchar
    ALTER TABLE "site_settings_sidebar_footer_items"
      ALTER COLUMN "type" TYPE varchar
      USING "type"::text;

    -- Now set all existing rows to 'custom' (all were URL-based)
    UPDATE "site_settings_sidebar_footer_items"
    SET "type" = 'custom';

    -- Apply the new link-type enum to the type column
    ALTER TABLE "site_settings_sidebar_footer_items"
      ALTER COLUMN "type" TYPE "public"."enum_site_settings_sidebar_footer_items_link_type"
      USING "type"::"public"."enum_site_settings_sidebar_footer_items_link_type";
    ALTER TABLE "site_settings_sidebar_footer_items"
      ALTER COLUMN "type" SET NOT NULL;

    -- Drop the old enum type (no longer needed)
    DROP TYPE IF EXISTS "public"."enum_site_settings_sidebar_footer_items_type";

    -- ============================================================
    -- STEP 9: Create posts_populated_authors_links tables
    -- ============================================================

    CREATE TABLE IF NOT EXISTS "posts_populated_authors_links" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" numeric NOT NULL REFERENCES "posts_populated_authors"("id") ON DELETE CASCADE,
      "icon" varchar,
      "type" varchar DEFAULT 'custom',
      "url" varchar,
      "page" varchar,
      "new_tab" boolean DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS "_posts_v_version_populated_authors_links" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "_posts_v_version_populated_authors"("id") ON DELETE CASCADE,
      "icon" varchar,
      "type" varchar DEFAULT 'custom',
      "url" varchar,
      "page" varchar,
      "new_tab" boolean DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS "posts_populated_authors_links_order_idx"
      ON "posts_populated_authors_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "posts_populated_authors_links_parent_id_idx"
      ON "posts_populated_authors_links" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "_posts_v_version_populated_authors_links_order_idx"
      ON "_posts_v_version_populated_authors_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_populated_authors_links_parent_id_idx"
      ON "_posts_v_version_populated_authors_links" USING btree ("_parent_id");

    -- Migrate linkedin from posts_populated_authors
    INSERT INTO "posts_populated_authors_links" ("_order", "_parent_id", "icon", "type", "url", "new_tab")
    SELECT 0, id, 'si:linkedin', 'custom', "linked_in_url", true
    FROM "posts_populated_authors"
    WHERE "linked_in_url" IS NOT NULL AND btrim("linked_in_url") != '';

    -- Migrate github from posts_populated_authors (after linkedin, use conditional _order)
    INSERT INTO "posts_populated_authors_links" ("_order", "_parent_id", "icon", "type", "url", "new_tab")
    SELECT
      CASE WHEN "linked_in_url" IS NOT NULL AND btrim("linked_in_url") != '' THEN 1 ELSE 0 END,
      id, 'si:github', 'custom', "github_url", true
    FROM "posts_populated_authors"
    WHERE "github_url" IS NOT NULL AND btrim("github_url") != '';

    -- Migrate linkedin from _posts_v_version_populated_authors
    INSERT INTO "_posts_v_version_populated_authors_links" ("_order", "_parent_id", "icon", "type", "url", "new_tab")
    SELECT 0, id, 'si:linkedin', 'custom', "linked_in_url", true
    FROM "_posts_v_version_populated_authors"
    WHERE "linked_in_url" IS NOT NULL AND btrim("linked_in_url") != '';

    -- Migrate github from _posts_v_version_populated_authors (after linkedin, use conditional _order)
    INSERT INTO "_posts_v_version_populated_authors_links" ("_order", "_parent_id", "icon", "type", "url", "new_tab")
    SELECT
      CASE WHEN "linked_in_url" IS NOT NULL AND btrim("linked_in_url") != '' THEN 1 ELSE 0 END,
      id, 'si:github', 'custom', "github_url", true
    FROM "_posts_v_version_populated_authors"
    WHERE "github_url" IS NOT NULL AND btrim("github_url") != '';

    ALTER TABLE "posts_populated_authors"
      DROP COLUMN IF EXISTS "linked_in_url",
      DROP COLUMN IF EXISTS "github_url";

    ALTER TABLE "_posts_v_version_populated_authors"
      DROP COLUMN IF EXISTS "linked_in_url",
      DROP COLUMN IF EXISTS "github_url";

    -- ============================================================
    -- STEP 10: Drop old columns from projects, _projects_v, users
    -- ============================================================

    ALTER TABLE "projects"
      DROP COLUMN IF EXISTS "external_url",
      DROP COLUMN IF EXISTS "github_url";

    ALTER TABLE "_projects_v"
      DROP COLUMN IF EXISTS "version_external_url",
      DROP COLUMN IF EXISTS "version_github_url";

    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "linked_in_url",
      DROP COLUMN IF EXISTS "github_url";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- ============================================================
    -- Reverse: restore old columns on projects, _projects_v, users
    -- ============================================================

    ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "external_url" varchar,
      ADD COLUMN IF NOT EXISTS "github_url" varchar;

    ALTER TABLE "_projects_v"
      ADD COLUMN IF NOT EXISTS "version_external_url" varchar,
      ADD COLUMN IF NOT EXISTS "version_github_url" varchar;

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "linked_in_url" varchar,
      ADD COLUMN IF NOT EXISTS "github_url" varchar;

    -- Reverse: restore old columns on posts_populated_authors tables
    ALTER TABLE "posts_populated_authors"
      ADD COLUMN IF NOT EXISTS "linked_in_url" varchar,
      ADD COLUMN IF NOT EXISTS "github_url" varchar;

    ALTER TABLE "_posts_v_version_populated_authors"
      ADD COLUMN IF NOT EXISTS "linked_in_url" varchar,
      ADD COLUMN IF NOT EXISTS "github_url" varchar;

    -- Restore data from posts_populated_authors_links
    UPDATE "posts_populated_authors" pa
    SET "linked_in_url" = pl."url"
    FROM "posts_populated_authors_links" pl
    WHERE pl."_parent_id" = pa."id"
      AND pl."icon" = 'si:linkedin'
      AND pl."_order" = 0;

    UPDATE "posts_populated_authors" pa
    SET "github_url" = pl."url"
    FROM "posts_populated_authors_links" pl
    WHERE pl."_parent_id" = pa."id"
      AND pl."icon" = 'si:github';

    -- Restore data from _posts_v_version_populated_authors_links
    UPDATE "_posts_v_version_populated_authors" pva
    SET "linked_in_url" = pl."url"
    FROM "_posts_v_version_populated_authors_links" pl
    WHERE pl."_parent_id" = pva."id"
      AND pl."icon" = 'si:linkedin'
      AND pl."_order" = 0;

    UPDATE "_posts_v_version_populated_authors" pva
    SET "github_url" = pl."url"
    FROM "_posts_v_version_populated_authors_links" pl
    WHERE pl."_parent_id" = pva."id"
      AND pl."icon" = 'si:github';

    -- Restore best-effort data from links tables back to old columns
    UPDATE "projects" p
    SET "github_url" = pl."url"
    FROM "projects_links" pl
    WHERE pl."_parent_id" = p."id"
      AND pl."icon" = 'si:github'
      AND pl."_order" = 0;

    UPDATE "_projects_v" pv
    SET "version_github_url" = pl."url"
    FROM "_projects_v_version_links" pl
    WHERE pl."_parent_id" = pv."id"
      AND pl."icon" = 'si:github'
      AND pl."_order" = 0;

    UPDATE "users" u
    SET "linked_in_url" = ul."url"
    FROM "users_links" ul
    WHERE ul."_parent_id" = u."id"
      AND ul."icon" = 'si:linkedin'
      AND ul."_order" = 0;

    UPDATE "users" u
    SET "github_url" = ul."url"
    FROM "users_links" ul
    WHERE ul."_parent_id" = u."id"
      AND ul."icon" = 'si:github'
      AND ul."_order" = 1;

    -- Cast type column back to varchar before mapping icon → old enum values
    ALTER TABLE "site_settings_sidebar_footer_items"
      ALTER COLUMN "type" DROP NOT NULL;
    ALTER TABLE "site_settings_sidebar_footer_items"
      ALTER COLUMN "type" TYPE varchar
      USING "type"::text;

    -- Restore old site_settings_sidebar_footer_items enum type
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_site_settings_sidebar_footer_items_type') THEN
        CREATE TYPE "public"."enum_site_settings_sidebar_footer_items_type" AS ENUM(
          'github', 'linkedin', 'email', 'rss', 'facebook', 'twitter', 'dribbble',
          'instagram', 'youtube', 'twitch', 'tiktok', 'medium', 'whatsapp', 'telegram',
          'discord', 'reddit', 'pinterest', 'behance', 'codepen', 'gitlab', 'stackoverflow', 'devto'
        );
      END IF;
    END $$;

    -- Map icon values back to type enum (best effort)
    UPDATE "site_settings_sidebar_footer_items"
    SET "type" = CASE "icon"
      WHEN 'si:github'        THEN 'github'
      WHEN 'si:linkedin'      THEN 'linkedin'
      WHEN 'ph:envelope'      THEN 'email'
      WHEN 'ph:rss'           THEN 'rss'
      WHEN 'si:facebook'      THEN 'facebook'
      WHEN 'si:x'             THEN 'twitter'
      WHEN 'si:dribbble'      THEN 'dribbble'
      WHEN 'si:instagram'     THEN 'instagram'
      WHEN 'si:youtube'       THEN 'youtube'
      WHEN 'si:twitch'        THEN 'twitch'
      WHEN 'si:tiktok'        THEN 'tiktok'
      WHEN 'si:medium'        THEN 'medium'
      WHEN 'si:whatsapp'      THEN 'whatsapp'
      WHEN 'si:telegram'      THEN 'telegram'
      WHEN 'si:discord'       THEN 'discord'
      WHEN 'si:reddit'        THEN 'reddit'
      WHEN 'si:pinterest'     THEN 'pinterest'
      WHEN 'si:behance'       THEN 'behance'
      WHEN 'si:codepen'       THEN 'codepen'
      WHEN 'si:gitlab'        THEN 'gitlab'
      WHEN 'si:stackoverflow' THEN 'stackoverflow'
      WHEN 'si:devto'         THEN 'devto'
      ELSE 'github'
    END;

    -- Cast type column back to enum
    ALTER TABLE "site_settings_sidebar_footer_items"
      ALTER COLUMN "type" TYPE "public"."enum_site_settings_sidebar_footer_items_type"
      USING "type"::"public"."enum_site_settings_sidebar_footer_items_type";

    -- Remove new columns added in up migration
    ALTER TABLE "site_settings_sidebar_footer_items"
      DROP COLUMN IF EXISTS "icon",
      DROP COLUMN IF EXISTS "new_tab",
      DROP COLUMN IF EXISTS "page";

    -- Drop new tables
    DROP TABLE IF EXISTS "posts_populated_authors_links" CASCADE;
    DROP TABLE IF EXISTS "_posts_v_version_populated_authors_links" CASCADE;
    DROP TABLE IF EXISTS "projects_links" CASCADE;
    DROP TABLE IF EXISTS "_projects_v_version_links" CASCADE;
    DROP TABLE IF EXISTS "users_links" CASCADE;
    DROP TABLE IF EXISTS "projects_rels" CASCADE;
    DROP TABLE IF EXISTS "_projects_v_rels" CASCADE;
    DROP TABLE IF EXISTS "users_rels" CASCADE;
    DROP TABLE IF EXISTS "site_settings_rels" CASCADE;

    -- Drop new enum types
    DROP TYPE IF EXISTS "public"."enum_projects_links_type";
    DROP TYPE IF EXISTS "public"."enum_projects_links_page";
    DROP TYPE IF EXISTS "public"."enum__projects_v_version_links_type";
    DROP TYPE IF EXISTS "public"."enum__projects_v_version_links_page";
    DROP TYPE IF EXISTS "public"."enum_users_links_type";
    DROP TYPE IF EXISTS "public"."enum_users_links_page";
    DROP TYPE IF EXISTS "public"."enum_site_settings_sidebar_footer_items_link_type";
    DROP TYPE IF EXISTS "public"."enum_site_settings_sidebar_footer_items_page";
  `)
}
