import { RootPage } from "@payloadcms/next/views";

import config from "@payload-config";

import { importMap } from "../importMap.js";

type Params = {
  segments?: string[];
};

type SearchParams = {
  [key: string]: string | string[];
};

type Props = {
  params: Promise<Params>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default function Page({ params, searchParams }: Props) {
  const normalizedParams = params.then(({ segments }) => ({
    segments: segments ?? [],
  }));
  const normalizedSearchParams: Promise<SearchParams> = searchParams.then((value) => {
    const entries = Object.entries(value).filter((entry): entry is [string, string | string[]] => {
      return typeof entry[1] !== "undefined";
    });

    return Object.fromEntries(entries);
  });

  return RootPage({
    config,
    importMap,
    params: normalizedParams,
    searchParams: normalizedSearchParams,
  });
}
