import { readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { Client } from "pg";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const migrationsDir = path.resolve(dirname, "../../../../packages/cms-core/src/migrations");

const getRequiredDatabaseUri = (): string => {
  const value = process.env.DATABASE_URI?.trim();

  if (!value) {
    throw new Error("Missing DATABASE_URI. Add it to apps/cms/.env before starting the CMS.");
  }

  return value;
};

const getExpectedMigrationNames = async (): Promise<string[]> => {
  const entries = await readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /^\d{8}_\d{6}\.ts$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.ts$/, ""))
    .sort();
};

const getRecordedMigrationNames = async (client: Client): Promise<Set<string>> => {
  const tableExists = await client.query<{ exists: string | null }>(
    "SELECT to_regclass('public.payload_migrations') AS exists",
  );

  if (!tableExists.rows[0]?.exists) {
    throw new Error(
      "Local database is missing the payload_migrations table. Run `bun run --filter @sidshub/cms migrate` before starting dev.",
    );
  }

  const result = await client.query<{ name: string }>("SELECT name FROM payload_migrations");
  return new Set(result.rows.map((row) => row.name));
};

const fail = (message: string): never => {
  console.error(`[db:check] ${message}`);
  process.exit(1);
};

const main = async (): Promise<void> => {
  if (process.env.PAYLOAD_DB_PUSH === "true") {
    fail(
      "PAYLOAD_DB_PUSH=true is disabled for normal development. Use `bun run --filter @sidshub/cms dev:push` only for explicit local experiments.",
    );
  }

  const expectedMigrationNames = await getExpectedMigrationNames();
  const client = new Client({ connectionString: getRequiredDatabaseUri() });

  await client.connect();

  try {
    const recordedMigrationNames = await getRecordedMigrationNames(client);

    if (recordedMigrationNames.has("dev")) {
      fail(
        "Database contains Payload's `dev` schema-push marker. Reset or reconcile the local database before starting dev, then run `bun run --filter @sidshub/cms migrate`.",
      );
    }

    const pendingMigrations = expectedMigrationNames.filter((name) => !recordedMigrationNames.has(name));

    if (pendingMigrations.length > 0) {
      fail(
        `Pending Payload migrations detected: ${pendingMigrations.join(", ")}. Run \`bun run --filter @sidshub/cms migrate\` before starting dev.`,
      );
    }

    console.log(`[db:check] Migration state is clean. ${expectedMigrationNames.length} migration(s) recorded.`);
  } finally {
    await client.end();
  }
};

void main().catch((error) => {
  console.error("[db:check] Migration preflight failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
