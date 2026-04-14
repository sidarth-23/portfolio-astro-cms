import type { CollectionAfterReadHook } from "payload";

import type { Series } from "../payload-types";

const isSeriesDoc = (value: unknown): value is Series => {
  return typeof value === "object" && value !== null;
};

export const populateSeries: CollectionAfterReadHook = async ({ doc }) => {
  const seriesDocs =
    typeof doc?.seriesLinks === "object" &&
    doc.seriesLinks !== null &&
    "docs" in doc.seriesLinks &&
    Array.isArray((doc.seriesLinks as { docs?: unknown[] }).docs)
      ? (doc.seriesLinks as { docs?: unknown[] }).docs?.filter(isSeriesDoc) ?? []
      : [];

  return {
    ...doc,
    series: seriesDocs,
  };
};
