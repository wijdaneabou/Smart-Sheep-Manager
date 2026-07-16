import "dotenv/config";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

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