import type { SerializedLinkNode } from "@payloadcms/richtext-lexical";

type DocRouteResolver = (slug: string) => string;

export type InternalDocHrefRouteMap = Partial<Record<string, DocRouteResolver>>;

const DEFAULT_INTERNAL_DOC_ROUTES: Record<string, DocRouteResolver> = {
  posts: (slug) => `/blog/${slug}`,
  projects: (slug) => `/projects/${slug}`,
};

const resolveLinkDoc = (linkNode: SerializedLinkNode): { relationTo?: string; slug?: string } => {
  const docValue = linkNode?.fields?.doc?.value;
  const relationTo = linkNode?.fields?.doc?.relationTo;

  if (!docValue || typeof docValue !== "object" || !("slug" in docValue)) {
    return {};
  }

  const slug = String(docValue.slug || "");
  const safeRelationTo = typeof relationTo === "string" ? relationTo : undefined;

  return {
    relationTo: safeRelationTo,
    slug,
  };
};

export const createInternalDocHrefResolver = (routeMap?: InternalDocHrefRouteMap) => {
  const routes = {
    ...DEFAULT_INTERNAL_DOC_ROUTES,
    ...routeMap,
  };

  return ({ linkNode }: { linkNode: SerializedLinkNode }): string => {
    const { relationTo, slug } = resolveLinkDoc(linkNode);

    if (!slug) {
      return "#";
    }

    if (relationTo && routes[relationTo]) {
      return routes[relationTo](slug);
    }

    return `/${slug}`;
  };
};
