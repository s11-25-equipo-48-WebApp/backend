import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import "reflect-metadata";

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? process.env.BD_URL,
  entities: [__dirname + '/../../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

//
// ──────────────────────────────────────────────────────────────
//   🔥 SCRIPTS EXTRA: DROP, TRUNCATE, RESET
// ──────────────────────────────────────────────────────────────
//

/** 
 * DROP DATABASE (todas las tablas)
 */
export async function dropDatabase() {
  await AppDataSource.initialize();
  console.log('⚠️  Dropping database...');
  await AppDataSource.dropDatabase();
  await AppDataSource.destroy();
  console.log('💥 Database dropped');
}

/**
 * TRUNCATE TABLES (solo borra datos)
 */
export async function truncateDatabase() {
  await AppDataSource.initialize();
  const entities = AppDataSource.entityMetadatas;

  console.log('🧹 Truncating tables...');

  for (const entity of entities) {
    const table = entity.tableName;
    await AppDataSource.query(
      `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`
    );
  }

  await AppDataSource.destroy();
  console.log('✨ Database truncated');
}

/**
 * RESET = DROP + RUN MIGRATIONS
 */
export async function resetDatabase() {
  await dropDatabase();

  await AppDataSource.initialize();
  console.log('🚀 Running migrations...');
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();

  console.log('🎉 Database reset completed');
}

//
// ──────────────────────────────────────────────────────────────
//   🟢 CLI HANDLER (cuando llamás: ts-node data-source.ts --drop)
// ──────────────────────────────────────────────────────────────
//

(async () => {
  const args = process.argv.slice(2);

  if (args.includes('--drop')) {
    await dropDatabase();
    process.exit(0);
  }

  if (args.includes('--truncate')) {
    await truncateDatabase();
    process.exit(0);
  }

  if (args.includes('--reset')) {
    await resetDatabase();
    process.exit(0);
  }
})();
