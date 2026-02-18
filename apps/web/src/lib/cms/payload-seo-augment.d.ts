import "@sidshub/cms-config/payload-types";

type SeoOverrides = {
  canonicalUrl?: string | null;
  robotsIndex?: boolean | null;
  robotsFollow?: boolean | null;
  schemaType?: "Article" | "TechArticle" | null;
};

declare module "@sidshub/cms-config/payload-types" {
  interface Post {
    seoOverrides?: SeoOverrides;
  }

  interface Project {
    seoOverrides?: SeoOverrides;
  }

  interface Category {
    seoOverrides?: SeoOverrides;
  }

  interface SiteSetting {
    seoOverrides?: SeoOverrides;
  }

  interface HomePage {
    seoOverrides?: SeoOverrides;
  }

  interface CvPage {
    seoOverrides?: SeoOverrides;
  }

  interface ProjectsPage {
    seoOverrides?: SeoOverrides;
  }
}
