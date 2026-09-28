import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { applyDatabaseMigrations } from './migrations.js'

const { Pool } = pg
const databaseDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || 'online_shopping_db',
  connectionTimeoutMillis: 5000,
})

try {
  const schema = await readFile(path.join(databaseDirectory, 'schema.sql'), 'utf8')
  const seed = await readFile(path.join(databaseDirectory, 'seed.sql'), 'utf8')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(schema)
    await client.query(seed)
    await applyDatabaseMigrations((sql) => client.query(sql))
    await client.query('COMMIT')
    console.log('PostgreSQL schema and sample data are ready.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} catch (error) {
  console.error(`Database setup failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
