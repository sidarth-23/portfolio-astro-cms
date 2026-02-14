import type { CmsPost } from "@/lib/cms/types";

export const FALLBACK_POSTS: CmsPost[] = [
  {
    id: "fallback-auth-post",
    title: "Stop Trusting the Client: A Real-World Guide to Authentication",
    slug: "stop-trusting-the-client-a-real-world-guide-to-authentication",
    excerpt:
      "Most tutorials teach you to use JWTs for everything, but is that actually secure? Let's dive into the trade-offs between Sessions and Tokens.",
    contentMarkdown:
      "## Introduction\n\nAuthentication is critical to application security. This is fallback content used when the CMS is unavailable during static builds.",
    publishedAt: "2025-10-04T00:00:00.000Z",
    status: "published",
    coverImage: {
      id: "fallback-cover",
      url: "/blog/implementing-authentication.jpg",
      alt: "Authentication blog cover",
    },
    primaryCategory: {
      id: "fallback-category",
      name: "Engineering",
      slug: "engineering",
    },
    tags: [
      {
        id: "fallback-tag-auth",
        name: "authentication",
        slug: "authentication",
      },
    ],
    meta: {
      title: "Authentication Guide",
      description: "Fallback SEO description",
    },
  },
];
