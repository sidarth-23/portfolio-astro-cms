# Sid's Portfolio

I want a portfolio that is simple, clean, and easy to navigate. I want to showcase my work and skills in a way that is easy to understand and navigate. I want to be able to quickly find what I'm looking for and be able to easily navigate through my portfolio. I want to be able to quickly find what I'm looking for and be able to easily navigate through my portfolio. As a developer, I feel that I'm losing my skills of documenting my skills and my skill to communicate. So, I planned to use this platform as a chance to both learn a new tech stack [Astro](https://astro.build/) and to document my skills.

## Tech Stack

- Astro
- Tailwind CSS
- Markdown
- MDX
- TypeScript

## Features

- Markdown and MDX support
- SEO-friendly with canonical URLs and OpenGraph data
- Sitemap support
- RSS Feed support

## Local Development Environment

The web server imports the shared Payload configuration for server-side content
queries, so it needs the same runtime variables as the CMS. Copy the local
template before starting the web app:

```bash
cp ../../.env.cms.example .env
```

Astro loads this file and bridges its server-side values to the shared Payload
configuration. Keep the file local; never commit credentials or production
secrets.

## Payload Typing Note

- `apps/web` consumes app-owned generated Payload types from `@sidshub/cms/payload-types`.
- Route SEO is configured in page globals: `Blog Page`, `Series Page`, and `404 Page`; per-series SEO is configured on each `Series` entry.

If you have any questions or comments, or with to connect with me, feel free to reach out to me on [LinkedIn](https://www.linkedin.com/in/sidarth-g/).
