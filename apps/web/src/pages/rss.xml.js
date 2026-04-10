import rss from "@astrojs/rss";
import { ASTRO_CMS_API_URL, ASTRO_CMS_READ_TOKEN } from "astro:env/server";
import { createCmsRestClient } from "@sidshub/cms-config/rest-client";

const cmsClient = createCmsRestClient({ apiUrl: ASTRO_CMS_API_URL, token: ASTRO_CMS_READ_TOKEN });

export async function GET(context) {
  /** @type {[import("@sidshub/cms-config/payload-types").Post[], import("@sidshub/cms-config/payload-types").SiteSetting]} */
  const [posts, siteSettings] = await Promise.all([cmsClient.getAllPublishedPosts(), cmsClient.getSiteSettings()]);
  const title = siteSettings.meta?.title?.trim() || "Sid's Hub";
  const description = siteSettings.meta?.description?.trim() || "Personal website and blog.";

  return rss({
    title,
    description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.excerpt,
      pubDate: post.publishedAt || post.createdAt,
      link: `/blog/${post.slug}/`,
    })),
  });
}
