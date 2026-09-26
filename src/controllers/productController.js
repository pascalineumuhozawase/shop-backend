import pool from '../config/db.js'
import { findProductById, findProducts, listCategories } from '../models/productModel.js'

function pagination(request) {
  return {
    page: Math.max(1, Number.parseInt(request.query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 12)),
  }
}

export async function list(request, response) {
  const data = await findProducts({ ...request.query, ...pagination(request) })
  response.json({ data })
}

export async function get(request, response) {
  const product = await findProductById(request.params.id)
  if (!product) return response.status(404).json({ message: 'Product not found.' })
  response.json({ data: product })
}

export async function categories(request, response) {
  response.json({ data: await listCategories() })
}

export async function adminList(request, response) {
  const data = await findProducts({ ...request.query, ...pagination(request), activeOnly: false })
  response.json({ data })
}

export async function create(request, response) {
  const body = request.body
  const [result] = await pool.execute(
    `INSERT INTO products (category_id, name, description, price, stock, image_url, is_new, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.categoryId, body.name, body.description || '', Number(body.price), Number(body.stock || 0), body.image || body.imageUrl || null, Boolean(body.isNew), Boolean(body.isFeatured)],
  )
  response.status(201).json({ data: await findProductById(result.insertId, { activeOnly: false }) })
}

export async function update(request, response) {
  const allowed = { categoryId: 'category_id', name: 'name', description: 'description', price: 'price', stock: 'stock', image: 'image_url', imageUrl: 'image_url', isNew: 'is_new', isFeatured: 'is_featured', rating: 'rating', popularity: 'popularity' }
  const updates = []
  const values = []
  for (const [key, value] of Object.entries(request.body)) {
    if (!allowed[key]) continue
    updates.push(`${allowed[key]} = ?`)
    values.push(key === 'isNew' || key === 'isFeatured' ? Boolean(value) : value)
  }
  if (!updates.length) return response.status(400).json({ message: 'No supported product fields were provided.' })
  values.push(request.params.id)
  const [result] = await pool.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values)
  if (!result.affectedRows) return response.status(404).json({ message: 'Product not found.' })
  response.json({ data: await findProductById(request.params.id, { activeOnly: false }) })
}

export async function remove(request, response) {
  const [result] = await pool.execute('UPDATE products SET is_active = 0 WHERE id = ?', [request.params.id])
  if (!result.affectedRows) return response.status(404).json({ message: 'Product not found.' })
  response.json({ data: { deleted: true } })
}

export async function adminCategories(request, response) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.slug, c.description, c.is_active AS isActive, COUNT(p.id) AS productCount, COUNT(p.id) AS productsCount
     FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     GROUP BY c.id ORDER BY c.name`,
  )
  response.json({ data: rows })
}

export async function createCategory(request, response) {
  const slug = request.body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const [result] = await pool.execute('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [request.body.name.trim(), slug, request.body.description || ''])
  const [rows] = await pool.execute('SELECT id, name, slug, description, is_active AS isActive FROM categories WHERE id = ?', [result.insertId])
  response.status(201).json({ data: rows[0] })
}

export async function updateCategory(request, response) {
  const { name, description, isActive } = request.body
  const slug = name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const [result] = await pool.execute(
    'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE id = ?',
    [name || null, slug || null, description ?? null, isActive === undefined ? null : Boolean(isActive), request.params.id],
  )
  if (!result.affectedRows) return response.status(404).json({ message: 'Category not found.' })
  const [rows] = await pool.execute('SELECT id, name, slug, description, is_active AS isActive FROM categories WHERE id = ?', [request.params.id])
  response.json({ data: rows[0] })
}

export async function removeCategory(request, response) {
  const [result] = await pool.execute('UPDATE categories SET is_active = 0 WHERE id = ?', [request.params.id])
  if (!result.affectedRows) return response.status(404).json({ message: 'Category not found.' })
  response.json({ data: { deleted: true } })
}