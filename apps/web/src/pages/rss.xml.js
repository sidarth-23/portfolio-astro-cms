import rss from "@astrojs/rss";
import { cmsClient } from "@/lib/cms";

export async function GET(context) {

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
      description: post.description,
      pubDate: post.publishedAt || post.createdAt,
      link: `/blog/${post.slug}/`,
    })),
  });
}
