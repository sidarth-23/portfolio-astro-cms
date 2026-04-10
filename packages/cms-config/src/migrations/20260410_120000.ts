import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "series_page" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"back_to_series_label" varchar DEFAULT 'Back to Series',
   	"meta_title" varchar NOT NULL,
   	"meta_description" varchar NOT NULL,
   	"meta_image_id" integer,
   	"updated_at" timestamp(3) with time zone,
   	"created_at" timestamp(3) with time zone
   );

   CREATE TABLE "not_found_page" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"title" varchar DEFAULT '404' NOT NULL,
   	"description" varchar DEFAULT 'The page you''re looking for couldn''t be found.' NOT NULL,
   	"cta_label" varchar DEFAULT 'Home',
   	"cta_href" varchar DEFAULT '/',
   	"emoji" varchar,
   	"meta_title" varchar NOT NULL,
   	"meta_description" varchar NOT NULL,
   	"meta_image_id" integer,
   	"updated_at" timestamp(3) with time zone,
   	"created_at" timestamp(3) with time zone
   );

   ALTER TABLE "series" ADD COLUMN "meta_title" varchar;
   ALTER TABLE "series" ADD COLUMN "meta_description" varchar;
   ALTER TABLE "series" ADD COLUMN "meta_image_id" integer;
   ALTER TABLE "series_page" ADD CONSTRAINT "series_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "not_found_page" ADD CONSTRAINT "not_found_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "series" ADD CONSTRAINT "series_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   CREATE INDEX "series_page_meta_meta_image_idx" ON "series_page" USING btree ("meta_image_id");
   CREATE INDEX "not_found_page_meta_meta_image_idx" ON "not_found_page" USING btree ("meta_image_id");
   CREATE INDEX "series_meta_meta_image_idx" ON "series" USING btree ("meta_image_id");

   ALTER TABLE "blog_page" DROP COLUMN "series_seo_title_template";
   ALTER TABLE "blog_page" DROP COLUMN "series_seo_description_template";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_page" ADD COLUMN "series_seo_title_template" varchar;
   ALTER TABLE "blog_page" ADD COLUMN "series_seo_description_template" varchar;

   DROP INDEX "series_page_meta_meta_image_idx";
   DROP INDEX "not_found_page_meta_meta_image_idx";
   DROP INDEX "series_meta_meta_image_idx";
   ALTER TABLE "series_page" DROP CONSTRAINT "series_page_meta_image_id_media_id_fk";
   ALTER TABLE "not_found_page" DROP CONSTRAINT "not_found_page_meta_image_id_media_id_fk";
   ALTER TABLE "series" DROP CONSTRAINT "series_meta_image_id_media_id_fk";
   ALTER TABLE "series" DROP COLUMN "meta_title";
   ALTER TABLE "series" DROP COLUMN "meta_description";
   ALTER TABLE "series" DROP COLUMN "meta_image_id";
   DROP TABLE "series_page";
   DROP TABLE "not_found_page";
  `)
}
