import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { SatoriFont } from "../../types";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.resolve(dirname, "fonts");

let cachedFonts: SatoriFont[] | null = null;

export async function loadOgFonts(): Promise<SatoriFont[]> {
  if (cachedFonts) return cachedFonts;

  const [regularData, boldData] = await Promise.all([
    readFile(path.join(FONTS_DIR, "atkinson-regular.woff")),
    readFile(path.join(FONTS_DIR, "atkinson-bold.woff")),
  ]);

  cachedFonts = [
    {
      name: "Atkinson Hyperlegible",
      data: regularData.buffer as ArrayBuffer,
      weight: 400,
      style: "normal",
    },
    {
      name: "Atkinson Hyperlegible",
      data: boldData.buffer as ArrayBuffer,
      weight: 700,
      style: "normal",
    },
  ];

  return cachedFonts;
}
