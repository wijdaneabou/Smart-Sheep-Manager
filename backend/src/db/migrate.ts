import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";

async function seedMigrationHistory(connection: mysql.Connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);

  const [rows] = await connection.query<any[]>(
    "SELECT id FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1"
  );

  if (rows.length > 0) {
    return;
  }

  const journalPath = path.resolve(process.cwd(), "drizzle/meta/_journal.json");
  const journalRaw = await fs.readFile(journalPath, "utf8");
  const journal = JSON.parse(journalRaw) as {
    entries: Array<{ tag: string; when: number }>;
  };

  const targetMigration = journal.entries.find(
    (entry) => entry.tag === "0003_first_slayback"
  );

  const createdAt = targetMigration ? targetMigration.when - 1 : Date.now();

  await connection.execute(
    "INSERT INTO __drizzle_migrations (`hash`, `created_at`) VALUES (?, ?)",
    ["bootstrap_before_0003_first_slayback", createdAt]
  );
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await seedMigrationHistory(connection);

  const db = drizzle(connection);

  await migrate(db, {
    migrationsFolder: "./drizzle",
  });

  console.log("✅ Migrations exécutées avec succès.");

  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
