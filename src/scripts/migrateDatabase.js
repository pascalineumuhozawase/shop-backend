import 'dotenv/config'
import pool from '../config/db.js'
import { applyDatabaseMigrations } from './migrations.js'

try {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await applyDatabaseMigrations((sql) => connection.execute(sql))
    await connection.commit()
    console.log('Database migrations are ready.')
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
} catch (error) {
  console.error(`Database migration failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
