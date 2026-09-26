import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

function publicUser(user) {
  return { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone, role: user.role, createdAt: user.created_at }
}

function makeToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

export async function register(request, response) {
  const { firstName, lastName, email, password, phone } = request.body
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
  if (existing.length) return response.status(409).json({ message: 'An account with this email already exists.' })
  const passwordHash = await bcrypt.hash(password, 12)
  const [result] = await pool.execute(
    'INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email.toLowerCase(), phone || null, passwordHash],
  )
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId])
  const user = publicUser(rows[0])
  response.status(201).json({ data: { token: makeToken(rows[0]), user } })
}

export async function login(request, response) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [request.body.email.toLowerCase()])
  if (!rows.length || !(await bcrypt.compare(request.body.password, rows[0].password_hash))) {
    return response.status(401).json({ message: 'Email or password is incorrect.' })
  }
  response.json({ data: { token: makeToken(rows[0]), user: publicUser(rows[0]) } })
}

export async function me(request, response) {
  response.json({ data: { user: { id: request.user.id, firstName: request.user.first_name, lastName: request.user.last_name, email: request.user.email, phone: request.user.phone, role: request.user.role, createdAt: request.user.created_at } } })
}

export async function updateProfile(request, response) {
  const fields = []
  const values = []
  for (const [key, column] of [['firstName', 'first_name'], ['lastName', 'last_name'], ['email', 'email'], ['phone', 'phone']]) {
    if (request.body[key] !== undefined) {
      fields.push(`${column} = ?`)
      values.push(key === 'email' ? request.body[key].toLowerCase() : request.body[key] || null)
    }
  }
  if (!fields.length) return response.status(400).json({ message: 'No profile fields were provided.' })
  values.push(request.user.id)
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [request.user.id])
  response.json({ data: publicUser(rows[0]) })
}

export function logout(request, response) {
  response.json({ data: { loggedOut: true } })
}