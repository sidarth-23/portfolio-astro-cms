import { faker } from "@faker-js/faker";
import type {
  BlogPage,
  Category,
  CvPage,
  HomePage,
  Post,
  Project,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
} from "../../../payload-types";

let _counter = 0;

const makeMongoId = () => {
  // Generate a MongoDB-like ObjectId (24-character hex string)
  // Structure: 4 bytes timestamp + 5 bytes random + 3 bytes counter
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  const counter = (_counter++ % 0xffffff).toString(16).padStart(6, "0");
  return (timestamp + random + counter).slice(0, 24);
};

export const nextId = makeMongoId;

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
  const post = {
    id: nextId(),
    title,
    description: faker.lorem.sentence(),
    content: makeRichText(),
    primaryCategory: category,
    coverImage: nextId(),
    authors: [],
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

  return {
    ...post,
    coverImage: overrides.coverImage ?? post.coverImage,
    authors: overrides.authors ?? post.authors,
  } as Post;
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
    description: faker.lorem.sentence(),
    _status: "published",
    meta: {
      title,
      description: faker.lorem.sentence(),
    },
    updatedAt: faker.date.past().toISOString(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
};

export const makeSiteSetting = (overrides: Partial<SiteSetting> = {}): SiteSetting => ({
  id: nextId(),
  meta: {
    title: "Sid's Hub",
    description: "Personal website and blog.",
  },
  sidebarFooterItems: [],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeHomePage = (posts: Post[], overrides: Partial<HomePage> = {}): HomePage => ({
  id: nextId(),
  greeting: "Hello,",
  name: faker.person.fullName(),
  role: faker.person.jobTitle(),
  about: makeRichText(),
  featuredSections: [
    {
      name: "Featured Posts",
      sourceCollection: "posts",
      posts: posts.slice(0, 3),
      id: nextId(),
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
      id: nextId(),
    },
  ],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const makeBlogPage = (overrides: Partial<BlogPage> = {}): BlogPage => ({
  id: nextId(),
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
  id: nextId(),
  sections: [
    {
      title: "Experience",
      type: "items",
      itemsVariant: "timeline",
      items: [
        {
          itemType: "organizationRole",
          title: faker.person.jobTitle(),
          organization: faker.company.name(),
          location: faker.location.city(),
          startMonth: "2022-01-01",
          currentlyWorkingHere: true,
          endMonth: null,
        },
      ],
    },
    {
      title: "Skills",
      type: "badges",
      badgeGroups: [
        {
          title: "Languages",
          badges: [
            { value: "TypeScript" },
            { value: "Rust" },
          ],
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
  id: nextId(),
  sections: [
    {
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
  id: nextId(),
  backToSeriesLabel: "Back to Series",
  meta: {
    title: "Mock Series",
    description: faker.lorem.sentence(),
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

