import pool from '../config/db.js'

export async function list(request, response) {
  const [items] = await pool.execute(
    `SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url AS image,
      p.rating, p.popularity, p.is_new AS "isNew", p.is_featured AS "isFeatured",
      p.is_active AS "isActive", c.id AS "categoryId", c.name AS category,
      p.created_at AS "createdAt", wi.created_at AS "savedAt"
     FROM wishlist_items wi
     JOIN products p ON p.id = wi.product_id
     JOIN categories c ON c.id = p.category_id
     WHERE wi.user_id = ? AND p.is_active = TRUE
     ORDER BY wi.created_at DESC`,
    [request.user.id],
  )
  response.json({ data: { items } })
}

export async function add(request, response) {
  const productId = Number(request.params.productId)
  const [products] = await pool.execute('SELECT id FROM products WHERE id = ? AND is_active = TRUE', [productId])
  if (!products.length) return response.status(404).json({ message: 'Product not found.' })
  await pool.execute(
    'INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?) ON CONFLICT (user_id, product_id) DO NOTHING',
    [request.user.id, productId],
  )
  response.status(201).json({ data: { productId } })
}

export async function remove(request, response) {
  await pool.execute('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?', [request.user.id, request.params.productId])
  response.json({ data: { removed: true } })
}
