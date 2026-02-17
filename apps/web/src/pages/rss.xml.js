import rss from "@astrojs/rss";

import { getAllPublishedPosts, getSiteSettings } from "@/lib/cms/client";

export async function GET(context) {
  const [posts, siteSettings] = await Promise.all([getAllPublishedPosts(), getSiteSettings()]);

  return rss({
    title: siteSettings.siteTitle,
    description: siteSettings.siteDescription,
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.excerpt,
      pubDate: post.publishedAt || post.createdAt,
      link: `/blog/${post.slug}/`,
    })),
  });
}
