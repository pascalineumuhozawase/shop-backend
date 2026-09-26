import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool from '../config/db.js'

const email = process.env.CREATE_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.CREATE_ADMIN_PASSWORD
const firstName = process.env.CREATE_ADMIN_FIRST_NAME?.trim() || 'Store'
const lastName = process.env.CREATE_ADMIN_LAST_NAME?.trim() || 'Administrator'

if (!email || !password || password.length < 12) {
  console.error('Set CREATE_ADMIN_EMAIL and a CREATE_ADMIN_PASSWORD of at least 12 characters in the environment, then retry.')
  process.exitCode = 1
} else {
  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) {
      console.error('An account with that email already exists. Use a different email; this command does not elevate existing accounts.')
      process.exitCode = 1
    } else {
      const passwordHash = await bcrypt.hash(password, 12)
      await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, \'admin\')',
        [firstName, lastName, email, passwordHash],
      )
      console.log(`Administrator account created for ${email}.`)
    }
  } catch (error) {
    console.error(`Could not create administrator: ${error.message}`)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}
