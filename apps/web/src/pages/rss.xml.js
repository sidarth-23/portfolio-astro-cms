import rss from "@astrojs/rss";
import { ASTRO_CMS_API_URL, ASTRO_CMS_READ_TOKEN } from "astro:env/server";
import { createCmsRestClient } from "@sidshub/cms-core/client/rest";

export async function GET(context) {
  const cmsClient = createCmsRestClient({ apiUrl: ASTRO_CMS_API_URL, token: ASTRO_CMS_READ_TOKEN });

  /** @type {[import("@sidshub/cms-core/payload-types").Post[], import("@sidshub/cms-core/payload-types").SiteSetting]} */
  const [posts, siteSettings] = await Promise.all([cmsClient.getAllPublishedPosts(), cmsClient.getSiteSettings()]);
  const title = siteSettings.meta?.title || "Sid's Hub";
  const description = siteSettings.meta?.description || "Personal website and blog.";

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
