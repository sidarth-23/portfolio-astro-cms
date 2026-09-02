import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { cmsClient } from "@/lib/cms";

const searchInput = z.object({
  view: z.enum(["posts", "series"]),
  page: z.number().int().positive(),
  search: z.string().optional(),
  category: z.string().optional(),
  series: z.string().optional(),
});

export const cms = {
  search: defineAction({
    input: searchInput,
    handler: async ({ view, page, search, category, series }) =>
      Promise.all([
        view === "posts" && (search || category || series)
          ? cmsClient.getPaginatedPublishedPosts({
              page,
              pageSize: 10,
              search,
              categorySlug: category,
              seriesSlug: series,
            })
          : Promise.resolve(null),
        cmsClient.getAllCategories(),
        cmsClient.getAllSeriesWithPosts(),
        cmsClient.getBlogPage(),
      ]),
  }),
};
