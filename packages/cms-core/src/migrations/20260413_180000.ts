import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ============================================================
    -- STEP 1: Create posts_tags inline array table
    --         (mirrors projects_tags pattern)
    -- ============================================================

    CREATE TABLE IF NOT EXISTS "posts_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_posts_v_version_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "_uuid" varchar,
      "value" varchar NOT NULL
    );

    -- ============================================================
    -- STEP 2: Foreign key constraints
    -- ============================================================

    DO $$ BEGIN
      ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v_version_tags" ADD CONSTRAINT "_posts_v_version_tags_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    -- ============================================================
    -- STEP 3: Indexes for new tables
    -- ============================================================

    CREATE INDEX IF NOT EXISTS "posts_tags_order_idx" ON "posts_tags" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "posts_tags_parent_id_idx" ON "posts_tags" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "_posts_v_version_tags_order_idx" ON "_posts_v_version_tags" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_tags_parent_id_idx" ON "_posts_v_version_tags" USING btree ("_parent_id");

    -- ============================================================
    -- STEP 4: Migrate existing tag relationship data into inline array
    --         (copy tag names from posts_rels → tags join into posts_tags)
    -- ============================================================

    INSERT INTO "posts_tags" ("_order", "_parent_id", "id", "value")
    SELECT
      ROW_NUMBER() OVER (PARTITION BY pr."parent_id" ORDER BY pr."order") AS "_order",
      pr."parent_id" AS "_parent_id",
      gen_random_uuid()::varchar AS "id",
      t."name" AS "value"
    FROM "posts_rels" pr
    JOIN "tags" t ON pr."tags_id" = t."id"
    WHERE pr."tags_id" IS NOT NULL;

    -- Migrate versioned posts tag relationships as well
    INSERT INTO "_posts_v_version_tags" ("_order", "_parent_id", "id", "value")
    SELECT
      ROW_NUMBER() OVER (PARTITION BY pvr."parent_id" ORDER BY pvr."order") AS "_order",
      pvr."parent_id" AS "_parent_id",
      gen_random_uuid()::varchar AS "id",
      t."name" AS "value"
    FROM "_posts_v_rels" pvr
    JOIN "tags" t ON pvr."tags_id" = t."id"
    WHERE pvr."tags_id" IS NOT NULL;

    -- ============================================================
    -- STEP 5: Drop tags_id FK and column from posts_rels
    -- ============================================================

    ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_tags_fk";
    DROP INDEX IF EXISTS "posts_rels_tags_id_idx";
    ALTER TABLE "posts_rels" DROP COLUMN IF EXISTS "tags_id";

    ALTER TABLE "_posts_v_rels" DROP CONSTRAINT IF EXISTS "_posts_v_rels_tags_fk";
    DROP INDEX IF EXISTS "_posts_v_rels_tags_id_idx";
    ALTER TABLE "_posts_v_rels" DROP COLUMN IF EXISTS "tags_id";

    -- ============================================================
    -- STEP 6: Drop tags_id from payload_locked_documents_rels
    -- ============================================================

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tags_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_tags_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tags_id";

    -- ============================================================
    -- STEP 7: Drop the tags collection table
    -- ============================================================

    DROP TABLE IF EXISTS "tags" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- ============================================================
    -- Reverse: Recreate tags table
    -- ============================================================

    CREATE TABLE IF NOT EXISTS "tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "description" varchar,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "tags_created_at_idx" ON "tags" USING btree ("created_at");

    -- ============================================================
    -- Reverse: Restore tags_id columns in rels tables
    -- ============================================================

    ALTER TABLE "posts_rels" ADD COLUMN IF NOT EXISTS "tags_id" integer;
    ALTER TABLE "_posts_v_rels" ADD COLUMN IF NOT EXISTS "tags_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tags_id" integer;

    DO $$ BEGIN
      ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_tags_fk"
        FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_tags_fk"
        FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk"
        FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "posts_rels_tags_id_idx" ON "posts_rels" USING btree ("tags_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_rels_tags_id_idx" ON "_posts_v_rels" USING btree ("tags_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");

    -- ============================================================
    -- Reverse: Restore tag data from posts_tags back to tags + posts_rels
    --          (best-effort — slugs are regenerated, descriptions are lost)
    -- ============================================================

    INSERT INTO "tags" ("name", "slug")
    SELECT DISTINCT "value", lower(regexp_replace("value", '[^a-zA-Z0-9]+', '-', 'g'))
    FROM "posts_tags"
    ON CONFLICT DO NOTHING;

    INSERT INTO "posts_rels" ("parent_id", "path", "order", "tags_id")
    SELECT pt."_parent_id", 'tags', pt."_order"::integer, t."id"
    FROM "posts_tags" pt
    JOIN "tags" t ON t."name" = pt."value";

    -- ============================================================
    -- Reverse: Drop new inline array tables
    -- ============================================================

    DROP TABLE IF EXISTS "posts_tags" CASCADE;
    DROP TABLE IF EXISTS "_posts_v_version_tags" CASCADE;
  `)
}
