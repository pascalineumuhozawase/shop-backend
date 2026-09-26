import jwt from 'jsonwebtoken'
import { asyncHandler } from './asyncHandler.js'
import pool from '../config/db.js'

export const requireAuth = asyncHandler(async (request, response, next) => {
  const authorization = request.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return response.status(401).json({ message: 'Authentication is required.' })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return response.status(401).json({ message: 'Your session is invalid or has expired.' })
  }

  const [users] = await pool.execute(
    'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ? AND is_active = 1',
    [decoded.sub],
  )
  if (!users.length) return response.status(401).json({ message: 'This account is no longer available.' })
  request.user = users[0]
  next()
})

export const optionalAuth = asyncHandler(async (request, response, next) => {
  const authorization = request.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return next()

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return response.status(401).json({ message: 'Your session is invalid or has expired.' })
  }

  const [users] = await pool.execute(
    'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ? AND is_active = 1',
    [decoded.sub],
  )
  if (!users.length) return response.status(401).json({ message: 'This account is no longer available.' })
  request.user = users[0]
  next()
})

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') return response.status(403).json({ message: 'Administrator access is required.' })
  next()
}