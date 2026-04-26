import rss from "@astrojs/rss";
import { cmsClient } from "@/lib/cms";

export async function GET(context) {
  let posts = [];
  let title = "Sid's Hub";
  let description = "Personal website and blog.";

  try {
    /** @type {[import("@sidshub/cms-core/payload-types").Post[], import("@sidshub/cms-core/payload-types").SiteSetting]} */
    const [fetchedPosts, siteSettings] = await Promise.all([
      cmsClient.getAllPublishedPosts(),
      cmsClient.getSiteSettings(),
    ]);
    posts = fetchedPosts;
    title = siteSettings.meta?.title || title;
    description = siteSettings.meta?.description || description;
  } catch {
    // CMS unavailable — return empty feed with defaults
  }

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
