import 'dotenv/config'
import app from './app.js'
import pool from './config/db.js'

const port = Number(process.env.PORT || 5000)
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured before starting the API.')

try {
  await pool.query('SELECT 1')
  app.listen(port, () => console.log(`Online Shopping API listening on port ${port}`))
} catch (error) {
  console.error(`Could not connect to MySQL: ${error.message}`)
  process.exit(1)
}