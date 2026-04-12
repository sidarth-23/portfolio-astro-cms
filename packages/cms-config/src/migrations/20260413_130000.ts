import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Remove legacy/non-canonical icon values from CV badge table
    UPDATE "cv_page_sections_badge_groups_badges"
      SET "icon" = NULL
      WHERE "icon" IS NOT NULL
        AND btrim("icon") <> ''
        AND "icon" NOT LIKE 'si:%'
        AND "icon" NOT LIKE 'ph:%';

    -- Remove legacy/non-canonical icon values from projects badges
    UPDATE "projects_badges"
      SET "icon" = NULL
      WHERE "icon" IS NOT NULL
        AND btrim("icon") <> ''
        AND "icon" NOT LIKE 'si:%'
        AND "icon" NOT LIKE 'ph:%';

    -- Remove legacy/non-canonical icon values from projects versions badges
    UPDATE "_projects_v_version_badges"
      SET "icon" = NULL
      WHERE "icon" IS NOT NULL
        AND btrim("icon") <> ''
        AND "icon" NOT LIKE 'si:%'
        AND "icon" NOT LIKE 'ph:%';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- irreversible data cleanup migration
    SELECT 1;
  `)
}
