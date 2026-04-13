import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_resume_url_type" AS ENUM('google', 'custom');
   ALTER TABLE "site_settings" ADD COLUMN "resume_url_type" "enum_site_settings_resume_url_type";
   ALTER TABLE "site_settings" ADD COLUMN "resume_url" varchar;
   ALTER TABLE "site_settings" ADD COLUMN "resume_download_url" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "resume_url_type";
   ALTER TABLE "site_settings" DROP COLUMN "resume_url";
   ALTER TABLE "site_settings" DROP COLUMN "resume_download_url";
   DROP TYPE "public"."enum_site_settings_resume_url_type";
  `)
}
