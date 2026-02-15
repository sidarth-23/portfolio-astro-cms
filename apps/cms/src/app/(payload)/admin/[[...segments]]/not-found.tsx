import type { Metadata } from "next";

import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";

import config from "@payload-config";

import { importMap } from "../importMap.js";

type Params = {
  segments?: string[];
};

type SearchParams = {
  [key: string]: string | string[];
};

type RawSearchParams = {
  [key: string]: string | string[] | undefined;
};

type Props = {
  params?: Promise<Params>;
  searchParams?: Promise<RawSearchParams>;
};

const normalizeParams = (params?: Promise<Params>) => {
  if (!params) {
    return Promise.resolve({ segments: [] });
  }

  return params.then(({ segments }) => ({
    segments: segments ?? [],
  }));
};

const normalizeSearchParams = (searchParams?: Promise<RawSearchParams>): Promise<SearchParams> => {
  if (!searchParams) {
    return Promise.resolve({});
  }

  return searchParams.then((value) => {
    const entries = Object.entries(value).filter((entry): entry is [string, string | string[]] => {
      return typeof entry[1] !== "undefined";
    });

    return Object.fromEntries(entries);
  });
};

export const generateMetadata = ({ params, searchParams }: Props): Promise<Metadata> => {
  return generatePageMetadata({
    config,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  });
};

export default function NotFound(props: Props) {
  const { params, searchParams } = props ?? {};

  return NotFoundPage({
    config,
    importMap,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  });
}
