import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "cv_page_sections_badges" CASCADE;

   CREATE TABLE IF NOT EXISTS "cv_page_sections_badge_groups" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "cv_page_sections_badge_groups_badges" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "icon_slug" varchar
   );

   DO $$ BEGIN
    ALTER TABLE "cv_page_sections_badge_groups" ADD CONSTRAINT "cv_page_sections_badge_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cv_page_sections"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   DO $$ BEGIN
    ALTER TABLE "cv_page_sections_badge_groups_badges" ADD CONSTRAINT "cv_page_sections_badge_groups_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cv_page_sections_badge_groups"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   CREATE INDEX IF NOT EXISTS "cv_page_sections_badge_groups_order_idx" ON "cv_page_sections_badge_groups" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "cv_page_sections_badge_groups_parent_id_idx" ON "cv_page_sections_badge_groups" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "cv_page_sections_badge_groups_badges_order_idx" ON "cv_page_sections_badge_groups_badges" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "cv_page_sections_badge_groups_badges_parent_id_idx" ON "cv_page_sections_badge_groups_badges" USING btree ("_parent_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "cv_page_sections_badge_groups_badges" CASCADE;
   DROP TABLE IF EXISTS "cv_page_sections_badge_groups" CASCADE;

   CREATE TABLE IF NOT EXISTS "cv_page_sections_badges" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL
   );

   DO $$ BEGIN
    ALTER TABLE "cv_page_sections_badges" ADD CONSTRAINT "cv_page_sections_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cv_page_sections"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   CREATE INDEX IF NOT EXISTS "cv_page_sections_badges_order_idx" ON "cv_page_sections_badges" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "cv_page_sections_badges_parent_id_idx" ON "cv_page_sections_badges" USING btree ("_parent_id");
  `)
}
