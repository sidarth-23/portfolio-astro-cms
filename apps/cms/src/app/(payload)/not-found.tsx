import type { Metadata } from "next";

import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";

import config from "@payload-config";

import { importMap } from "./importMap.js";

type Params = {
  segments: string[];
};

type SearchParams = {
  [key: string]: string | string[];
};

const emptyParams = Promise.resolve<Params>({ segments: [] });
const emptySearchParams = Promise.resolve<SearchParams>({});

export const generateMetadata = (): Promise<Metadata> => {
  return generatePageMetadata({
    config,
    params: emptyParams,
    searchParams: emptySearchParams,
  });
};

export default function NotFound() {
  return NotFoundPage({
    config,
    importMap,
    params: emptyParams,
    searchParams: emptySearchParams,
  });
}
