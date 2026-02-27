import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "series_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer
    );

    CREATE INDEX IF NOT EXISTS "series_rels_order_idx" ON "series_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "series_rels_parent_idx" ON "series_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "series_rels_path_idx" ON "series_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "series_rels_posts_id_idx" ON "series_rels" USING btree ("posts_id");

    ALTER TABLE IF EXISTS "series_rels"
      DROP CONSTRAINT IF EXISTS "series_rels_parent_fk";
    ALTER TABLE IF EXISTS "series_rels"
      ADD CONSTRAINT "series_rels_parent_fk"
      FOREIGN KEY ("parent_id")
      REFERENCES "public"."series"("id")
      ON DELETE cascade
      ON UPDATE no action;

    ALTER TABLE IF EXISTS "series_rels"
      DROP CONSTRAINT IF EXISTS "series_rels_posts_fk";
    ALTER TABLE IF EXISTS "series_rels"
      ADD CONSTRAINT "series_rels_posts_fk"
      FOREIGN KEY ("posts_id")
      REFERENCES "public"."posts"("id")
      ON DELETE cascade
      ON UPDATE no action;

    CREATE TABLE IF NOT EXISTS "home_page_featured_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar,
      "description" jsonb
    );

    CREATE INDEX IF NOT EXISTS "home_page_featured_sections_order_idx" ON "home_page_featured_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "home_page_featured_sections_parent_id_idx" ON "home_page_featured_sections" USING btree ("_parent_id");

    ALTER TABLE IF EXISTS "home_page_featured_sections"
      DROP CONSTRAINT IF EXISTS "home_page_featured_sections_parent_id_fk";
    ALTER TABLE IF EXISTS "home_page_featured_sections"
      ADD CONSTRAINT "home_page_featured_sections_parent_id_fk"
      FOREIGN KEY ("_parent_id")
      REFERENCES "public"."home_page"("id")
      ON DELETE cascade
      ON UPDATE no action;

    CREATE TABLE IF NOT EXISTS "home_page_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "posts_id" integer
    );

    CREATE INDEX IF NOT EXISTS "home_page_rels_order_idx" ON "home_page_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "home_page_rels_parent_idx" ON "home_page_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "home_page_rels_path_idx" ON "home_page_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "home_page_rels_posts_id_idx" ON "home_page_rels" USING btree ("posts_id");

    ALTER TABLE IF EXISTS "home_page_rels"
      DROP CONSTRAINT IF EXISTS "home_page_rels_parent_fk";
    ALTER TABLE IF EXISTS "home_page_rels"
      ADD CONSTRAINT "home_page_rels_parent_fk"
      FOREIGN KEY ("parent_id")
      REFERENCES "public"."home_page"("id")
      ON DELETE cascade
      ON UPDATE no action;

    ALTER TABLE IF EXISTS "home_page_rels"
      DROP CONSTRAINT IF EXISTS "home_page_rels_posts_fk";
    ALTER TABLE IF EXISTS "home_page_rels"
      ADD CONSTRAINT "home_page_rels_posts_fk"
      FOREIGN KEY ("posts_id")
      REFERENCES "public"."posts"("id")
      ON DELETE cascade
      ON UPDATE no action;

    ALTER TABLE IF EXISTS "posts"
      ADD COLUMN IF NOT EXISTS "home_sections_summary" varchar;

    ALTER TABLE IF EXISTS "_posts_v"
      ADD COLUMN IF NOT EXISTS "version_home_sections_summary" varchar;

    INSERT INTO "series_rels" ("order", "parent_id", "path", "posts_id")
    SELECT
      ROW_NUMBER() OVER (
        PARTITION BY p."series_id"
        ORDER BY
          COALESCE(p."series_order", 2147483647) ASC,
          p."published_at" DESC NULLS LAST,
          p."id" ASC
      ) - 1,
      p."series_id",
      'posts',
      p."id"
    FROM "posts" p
    WHERE p."series_id" IS NOT NULL;

    INSERT INTO "home_page_featured_sections" ("_order", "_parent_id", "id", "name", "description")
    SELECT
      0,
      hp."id",
      CONCAT('featured-section-', hp."id"),
      COALESCE(NULLIF(hp."featured_section_title", ''), 'Featured'),
      NULL
    FROM "home_page" hp
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "home_page_rels" ("order", "parent_id", "path", "posts_id")
    SELECT
      ROW_NUMBER() OVER (
        PARTITION BY hp."id"
        ORDER BY p."published_at" DESC NULLS LAST, p."id" ASC
      ) - 1,
      hp."id",
      'featuredSections.posts',
      p."id"
    FROM "home_page" hp
    INNER JOIN "posts" p
      ON p."feature_on_home" = true;

    WITH section_names AS (
      SELECT
        rel."posts_id" AS post_id,
        STRING_AGG(sec."name", ', ' ORDER BY rel."order" ASC) AS names
      FROM "home_page_rels" rel
      INNER JOIN "home_page_featured_sections" sec
        ON sec."_parent_id" = rel."parent_id"
      WHERE rel."path" = 'featuredSections.posts'
      GROUP BY rel."posts_id"
    )
    UPDATE "posts" p
    SET "home_sections_summary" = section_names.names
    FROM section_names
    WHERE p."id" = section_names.post_id;

    ALTER TABLE IF EXISTS "posts"
      DROP COLUMN IF EXISTS "series_order",
      DROP COLUMN IF EXISTS "feature_on_home";

    ALTER TABLE IF EXISTS "_posts_v"
      DROP COLUMN IF EXISTS "version_series_order",
      DROP COLUMN IF EXISTS "version_feature_on_home";

    ALTER TABLE IF EXISTS "home_page"
      DROP COLUMN IF EXISTS "featured_section_title";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "posts"
      ADD COLUMN IF NOT EXISTS "series_order" numeric,
      ADD COLUMN IF NOT EXISTS "feature_on_home" boolean DEFAULT false;

    ALTER TABLE IF EXISTS "_posts_v"
      ADD COLUMN IF NOT EXISTS "version_series_order" numeric,
      ADD COLUMN IF NOT EXISTS "version_feature_on_home" boolean;

    ALTER TABLE IF EXISTS "home_page"
      ADD COLUMN IF NOT EXISTS "featured_section_title" varchar;

    WITH ranked_series_posts AS (
      SELECT
        rel."posts_id" AS post_id,
        rel."parent_id" AS series_id,
        ROW_NUMBER() OVER (
          PARTITION BY rel."parent_id"
          ORDER BY rel."order" ASC NULLS LAST, rel."id" ASC
        ) AS position
      FROM "series_rels" rel
      WHERE rel."path" = 'posts'
    )
    UPDATE "posts" p
    SET
      "series_id" = ranked_series_posts.series_id,
      "series_order" = ranked_series_posts.position
    FROM ranked_series_posts
    WHERE p."id" = ranked_series_posts.post_id;

    UPDATE "posts" p
    SET "feature_on_home" = true
    WHERE EXISTS (
      SELECT 1
      FROM "home_page_rels" rel
      WHERE rel."path" = 'featuredSections.posts'
        AND rel."posts_id" = p."id"
    );

    WITH first_sections AS (
      SELECT DISTINCT ON (sec."_parent_id")
        sec."_parent_id" AS home_page_id,
        sec."name" AS section_name
      FROM "home_page_featured_sections" sec
      ORDER BY sec."_parent_id", sec."_order" ASC
    )
    UPDATE "home_page" hp
    SET "featured_section_title" = COALESCE(first_sections.section_name, 'Featured')
    FROM first_sections
    WHERE hp."id" = first_sections.home_page_id;

    UPDATE "home_page"
    SET "featured_section_title" = COALESCE("featured_section_title", 'Featured');

    ALTER TABLE IF EXISTS "_posts_v"
      DROP COLUMN IF EXISTS "version_home_sections_summary";

    ALTER TABLE IF EXISTS "posts"
      DROP COLUMN IF EXISTS "home_sections_summary";

    DROP TABLE IF EXISTS "home_page_rels";
    DROP TABLE IF EXISTS "home_page_featured_sections";
    DROP TABLE IF EXISTS "series_rels";
  `);
}
