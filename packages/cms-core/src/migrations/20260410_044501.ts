import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "blog_page" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"series_seo_title_template" varchar,
   	"series_seo_description_template" varchar,
   	"meta_title" varchar NOT NULL,
   	"meta_description" varchar NOT NULL,
   	"meta_image_id" integer,
   	"updated_at" timestamp(3) with time zone,
   	"created_at" timestamp(3) with time zone
   );

   ALTER TABLE "blog_page" ADD CONSTRAINT "blog_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

   CREATE INDEX "blog_page_meta_meta_image_idx" ON "blog_page" USING btree ("meta_image_id");

   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_route_seo_blog_home_image_id_media_id_fk";
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_route_seo_blog_series_image_id_media_id_fk";
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_route_seo_not_found_image_id_media_id_fk";
   DROP INDEX "site_settings_route_seo_blog_home_route_seo_blog_home_im_idx";
   DROP INDEX "site_settings_route_seo_blog_series_route_seo_blog_serie_idx";
   DROP INDEX "site_settings_route_seo_not_found_route_seo_not_found_im_idx";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_blog_home_title";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_blog_home_description";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_blog_home_image_id";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_blog_series_title";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_blog_series_description";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_blog_series_image_id";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_not_found_title";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_not_found_description";
   ALTER TABLE "site_settings" DROP COLUMN "route_seo_not_found_image_id";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_blog_home_title" varchar NOT NULL;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_blog_home_description" varchar NOT NULL;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_blog_home_image_id" integer;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_blog_series_title" varchar NOT NULL;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_blog_series_description" varchar NOT NULL;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_blog_series_image_id" integer;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_not_found_title" varchar NOT NULL;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_not_found_description" varchar NOT NULL;
   ALTER TABLE "site_settings" ADD COLUMN "route_seo_not_found_image_id" integer;
   ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_route_seo_blog_home_image_id_media_id_fk" FOREIGN KEY ("route_seo_blog_home_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_route_seo_blog_series_image_id_media_id_fk" FOREIGN KEY ("route_seo_blog_series_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_route_seo_not_found_image_id_media_id_fk" FOREIGN KEY ("route_seo_not_found_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   CREATE INDEX "site_settings_route_seo_blog_home_route_seo_blog_home_im_idx" ON "site_settings" USING btree ("route_seo_blog_home_image_id");
   CREATE INDEX "site_settings_route_seo_blog_series_route_seo_blog_serie_idx" ON "site_settings" USING btree ("route_seo_blog_series_image_id");
   CREATE INDEX "site_settings_route_seo_not_found_route_seo_not_found_im_idx" ON "site_settings" USING btree ("route_seo_not_found_image_id");

   DROP TABLE "blog_page";
  `)
}
