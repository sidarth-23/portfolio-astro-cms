import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_page" ADD COLUMN "title" varchar DEFAULT 'Blog' NOT NULL;
   ALTER TABLE "blog_page" ADD COLUMN "intro" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_page" DROP COLUMN "title";
   ALTER TABLE "blog_page" DROP COLUMN "intro";
  `)
}
