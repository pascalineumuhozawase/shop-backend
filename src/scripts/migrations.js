import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/migrations')

export async function applyDatabaseMigrations(execute) {
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDirectory, file), 'utf8')
    await execute(sql)
  }
}
