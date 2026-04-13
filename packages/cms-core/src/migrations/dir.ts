import path from "path";
import { fileURLToPath } from "url";

export const migrationDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
