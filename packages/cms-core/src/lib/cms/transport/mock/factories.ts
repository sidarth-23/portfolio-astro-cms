import { faker } from "@faker-js/faker";
import type {
  BlogPage,
  Category,
  CvPage,
  HomePage,
  NotFoundPage,
  Post,
  Project,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
} from "../../../../payload-types";

let _id = 100;
const nextId = () => _id++;

export const makeRichText = () => ({
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [
          {
            type: "text",
            version: 1,
            text: faker.lorem.sentence(),
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
        direction: "ltr" as const,
        format: "" as const,
        indent: 0,
      },
    ],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  },
});

export const makeCategory = (overrides: Partial<Category> = {}): Category => {
  const name = faker.helpers.arrayElement(["Technology", "Engineering", "Design", "DevOps", "Science"]);
  return {
    id: nextId(),
    name,
    slug: name.toLowerCase(),
    updatedAt: faker.date.past().toISOString(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
};

export const makePost = (category: Category, overrides: Partial<Post> = {}): Post => {
  const title = faker.lorem.words(4);
  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const now = faker.date.past().toISOString();
  return {
    id: nextId(),
    title,
    excerpt: faker.lorem.sentence(),
    content: makeRichText(),
    primaryCategory: category,
    slug,
    publishedAt: now,
    updatedAt: now,
    createdAt: now,
    _status: "published",
    meta: {
      title,
      description: faker.lorem.sentence(),
    },
    ...overrides,
  };
};

export const makeSeries = (posts: Post[], overrides: Partial<Series> = {}): Series => {
  const name = faker.lorem.words(3);
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return {
    id: nextId(),
    name,
    slug,
    posts,
    updatedAt: faker.date.past().toISOString(),
    createdAt: faker.date.past().toISOString(),
    meta: {
      title: name,
      description: faker.lorem.sentence(),
    },
    ...overrides,
  };
};

export const makeProject = (overrides: Partial<Project> = {}): Project => {
  const title = faker.commerce.productName();
  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return {
    id: nextId(),
    title,
    slug,
    description: makeRichText(),
    _status: "published",
    updatedAt: faker.date.past().toISOString(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
};

export const makeSiteSetting = (overrides: Partial<SiteSetting> = {}): SiteSetting => ({
  id: 1,
  sidebarFooterItems: [],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeHomePage = (posts: Post[], overrides: Partial<HomePage> = {}): HomePage => ({
  id: 1,
  greeting: "Hello,",
  name: faker.person.fullName(),
  role: faker.person.jobTitle(),
  about: makeRichText(),
  meta: {
    title: "Mock Portfolio",
    description: faker.lorem.sentence(),
  },
  featuredSections: [
    {
      name: "Featured Posts",
      collection: "posts",
      posts: posts.slice(0, 3),
      id: "section-1",
    },
  ],
  ctaButtons: [
    {
      title: "View Blog",
      variant: "primary",
      link: {
        type: "page",
        page: "blog",
        newTab: false,
      },
      id: "btn-1",
    },
  ],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeBlogPage = (overrides: Partial<BlogPage> = {}): BlogPage => ({
  id: 1,
  title: "Blog",
  intro: "Welcome to the mock blog.",
  meta: {
    title: "Mock Blog",
    description: faker.lorem.sentence(),
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeCvPage = (overrides: Partial<CvPage> = {}): CvPage => ({
  id: 1,
  sections: [
    {
      id: "sec-1",
      title: "Experience",
      type: "items",
      itemsVariant: "timeline",
      items: [
        {
          id: "item-1",
          itemType: "organizationRole",
          title: faker.person.jobTitle(),
          organization: faker.company.name(),
          location: faker.location.city(),
          startMonth: "2022-01-01",
          endMonth: null,
        },
      ],
    },
    {
      id: "sec-2",
      title: "Skills",
      type: "badges",
      badgeGroups: [
        {
          title: "Languages",
          badges: [
            { value: "TypeScript", id: "b-1" },
            { value: "Rust", id: "b-2" },
          ],
          id: "bg-1",
        },
      ],
    },
  ],
  meta: {
    title: "Mock CV",
    description: faker.lorem.sentence(),
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeProjectsPage = (projects: Project[], overrides: Partial<ProjectsPage> = {}): ProjectsPage => ({
  id: 1,
  sections: [
    {
      id: "sec-1",
      title: "All Projects",
      projects,
    },
  ],
  meta: {
    title: "Mock Projects",
    description: faker.lorem.sentence(),
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeSeriesPage = (overrides: Partial<SeriesPage> = {}): SeriesPage => ({
  id: 1,
  backToSeriesLabel: "Back to Series",
  meta: {
    title: "Mock Series",
    description: faker.lorem.sentence(),
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeNotFoundPage = (overrides: Partial<NotFoundPage> = {}): NotFoundPage => ({
  id: 1,
  title: "404",
  description: "Page not found.",
  ctaLabel: "Go Home",
  ctaHref: "/",
  emoji: "🔍",
  meta: {
    title: "404 – Not Found",
    description: "Page not found.",
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});
