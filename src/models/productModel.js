import pool from '../config/db.js'

const productFields = `p.id, p.name, p.description, p.price, p.stock,
  p.image_url AS image, p.rating, p.popularity, p.is_new AS isNew,
  p.is_featured AS isFeatured, p.is_active AS isActive, c.id AS categoryId, c.name AS category,
  p.created_at AS createdAt`

export async function findProducts({ search, category, minPrice, maxPrice, inStock, sort, page, limit, activeOnly = true }) {
  const filters = []
  const values = []
  if (activeOnly) filters.push('p.is_active = 1')
  if (search) {
    filters.push('(p.name LIKE ? OR p.description LIKE ?)')
    values.push(`%${search}%`, `%${search}%`)
  }
  if (category && category !== 'all') {
    filters.push('(c.id = ? OR LOWER(c.slug) = LOWER(?) OR LOWER(c.name) = LOWER(?))')
    values.push(category, String(category), String(category))
  }
  if (minPrice !== undefined && minPrice !== '') { filters.push('p.price >= ?'); values.push(Number(minPrice)) }
  if (maxPrice !== undefined && maxPrice !== '') { filters.push('p.price <= ?'); values.push(Number(maxPrice)) }
  if (inStock === true || inStock === 'true' || inStock === '1') filters.push('p.stock > 0')

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const orderBy = {
    'price-asc': 'p.price ASC', price: 'p.price ASC',
    'price-desc': 'p.price DESC', newest: 'p.created_at DESC', createdAt: 'p.created_at DESC',
    popular: 'p.popularity DESC', popularity: 'p.popularity DESC',
  }[sort] || 'p.is_featured DESC, p.created_at DESC'
  const offset = (page - 1) * limit
  const [items] = await pool.execute(
    `SELECT ${productFields} FROM products p JOIN categories c ON c.id = p.category_id ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id ${where}`,
    values,
  )
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) }
}

export async function findProductById(id, { activeOnly = true, connection = pool } = {}) {
  const [rows] = await connection.execute(
    `SELECT ${productFields} FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ? ${activeOnly ? 'AND p.is_active = 1' : ''}`,
    [id],
  )
  return rows[0] || null
}

export async function listCategories() {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.slug, c.description, c.is_active AS isActive,
      COUNT(p.id) AS productCount FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.name`,
  )
  return rows
}

export { productFields }