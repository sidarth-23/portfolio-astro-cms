import rss from "@astrojs/rss";

import { SITE_DESCRIPTION, SITE_TITLE } from "@/consts";
import { getAllPublishedPosts } from "@/lib/cms/client";

export async function GET(context) {
  const posts = await getAllPublishedPosts();

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.excerpt,
      pubDate: post.publishedAt || post.createdAt,
      link: `/blog/${post.slug}/`,
    })),
  });
}
