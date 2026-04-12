import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_projects_links_page') THEN
        ALTER TYPE "public"."enum_projects_links_page" ADD VALUE IF NOT EXISTS 'rss';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__projects_v_version_links_page') THEN
        ALTER TYPE "public"."enum__projects_v_version_links_page" ADD VALUE IF NOT EXISTS 'rss';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_links_page') THEN
        ALTER TYPE "public"."enum_users_links_page" ADD VALUE IF NOT EXISTS 'rss';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_site_settings_sidebar_footer_items_page') THEN
        ALTER TYPE "public"."enum_site_settings_sidebar_footer_items_page" ADD VALUE IF NOT EXISTS 'rss';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_home_page_cta_buttons_link_page') THEN
        ALTER TYPE "public"."enum_home_page_cta_buttons_link_page" ADD VALUE IF NOT EXISTS 'rss';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users_links') THEN
        UPDATE "users_links"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings_sidebar_footer_items') THEN
        UPDATE "site_settings_sidebar_footer_items"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts_populated_authors_links') THEN
        UPDATE "posts_populated_authors_links"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_posts_v_version_populated_authors_links') THEN
        UPDATE "_posts_v_version_populated_authors_links"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects_links') THEN
        UPDATE "projects_links"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_projects_v_version_links') THEN
        UPDATE "_projects_v_version_links"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects_badges') THEN
        UPDATE "projects_badges"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_projects_v_version_badges') THEN
        UPDATE "_projects_v_version_badges"
        SET "icon" = 'ph:linkedin-logo'
        WHERE "icon" = 'si:linkedin';
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users_links') THEN
        UPDATE "users_links"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings_sidebar_footer_items') THEN
        UPDATE "site_settings_sidebar_footer_items"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts_populated_authors_links') THEN
        UPDATE "posts_populated_authors_links"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_posts_v_version_populated_authors_links') THEN
        UPDATE "_posts_v_version_populated_authors_links"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects_links') THEN
        UPDATE "projects_links"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_projects_v_version_links') THEN
        UPDATE "_projects_v_version_links"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects_badges') THEN
        UPDATE "projects_badges"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_projects_v_version_badges') THEN
        UPDATE "_projects_v_version_badges"
        SET "icon" = 'si:linkedin'
        WHERE "icon" = 'ph:linkedin-logo';
      END IF;
    END $$;
  `)
}
