import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add icon column to cv_page_sections_badge_groups_badges
    ALTER TABLE "cv_page_sections_badge_groups_badges"
      ADD COLUMN IF NOT EXISTS "icon" varchar;

    -- Migrate existing icon_slug data to new prefixed format
    UPDATE "cv_page_sections_badge_groups_badges"
      SET "icon" = 'si:' || "icon_slug"
      WHERE "icon_slug" IS NOT NULL AND "icon_slug" <> '';

    -- Drop old icon_slug column
    ALTER TABLE "cv_page_sections_badge_groups_badges"
      DROP COLUMN IF EXISTS "icon_slug";

    -- Add icon column to projects_badges
    ALTER TABLE "projects_badges"
      ADD COLUMN IF NOT EXISTS "icon" varchar;

    -- Add icon column to _projects_v_version_badges
    ALTER TABLE "_projects_v_version_badges"
      ADD COLUMN IF NOT EXISTS "icon" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Restore icon_slug column in cv_page_sections_badge_groups_badges
    ALTER TABLE "cv_page_sections_badge_groups_badges"
      ADD COLUMN IF NOT EXISTS "icon_slug" varchar;

    -- Migrate back: strip "si:" prefix (phosphor icons lose their prefix, acceptable rollback)
    UPDATE "cv_page_sections_badge_groups_badges"
      SET "icon_slug" = SUBSTRING("icon" FROM 4)
      WHERE "icon" LIKE 'si:%';

    -- Drop icon column
    ALTER TABLE "cv_page_sections_badge_groups_badges"
      DROP COLUMN IF EXISTS "icon";

    -- Remove icon column from projects_badges
    ALTER TABLE "projects_badges"
      DROP COLUMN IF EXISTS "icon";

    -- Remove icon column from _projects_v_version_badges
    ALTER TABLE "_projects_v_version_badges"
      DROP COLUMN IF EXISTS "icon";
  `)
}
