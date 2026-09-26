import pool from '../config/db.js'

async function getOrCreateCart(userId, connection = pool) {
  const [result] = await connection.execute(
    'INSERT INTO carts (user_id) VALUES (?) ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id',
    [userId],
  )
  return result.insertId
}

export async function getCart(request, response) {
  const cartId = await getOrCreateCart(request.user.id)
  const [items] = await pool.execute(
    `SELECT ci.quantity, p.id, p.name, p.description, p.price, p.stock, p.image_url AS image,
      p.rating, p.popularity, p.is_new AS "isNew", c.name AS category
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
    JOIN categories c ON c.id = p.category_id WHERE ci.cart_id = ? AND p.is_active = TRUE`,
    [cartId],
  )
  response.json({ data: { items: items.map(({ quantity, ...product }) => ({ product, quantity })) } })
}

export async function addItem(request, response) {
  const productId = Number(request.body.productId)
  const quantity = Number(request.body.quantity || 1)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return response.status(400).json({ message: 'Quantity must be between 1 and 99.' })
  const [products] = await pool.execute('SELECT id, stock FROM products WHERE id = ? AND is_active = TRUE', [productId])
  if (!products.length) return response.status(404).json({ message: 'Product not found.' })
  const cartId = await getOrCreateCart(request.user.id)
  const [existing] = await pool.execute('SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId])
  const nextQuantity = (existing[0]?.quantity || 0) + quantity
  if (nextQuantity > products[0].stock) return response.status(409).json({ message: 'The requested quantity exceeds available stock.' })
  await pool.execute(
    `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [cartId, productId, nextQuantity],
  )
  response.status(201).json({ data: { productId, quantity: nextQuantity } })
}

export async function updateItem(request, response) {
  const quantity = Number(request.body.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return response.status(400).json({ message: 'Quantity must be between 1 and 99.' })
  const cartId = await getOrCreateCart(request.user.id)
  const [products] = await pool.execute('SELECT stock FROM products WHERE id = ? AND is_active = TRUE', [request.params.productId])
  if (!products.length) return response.status(404).json({ message: 'Product not found.' })
  if (quantity > products[0].stock) return response.status(409).json({ message: 'The requested quantity exceeds available stock.' })
  const [result] = await pool.execute('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?', [quantity, cartId, request.params.productId])
  if (!result.affectedRows) return response.status(404).json({ message: 'This product is not in your cart.' })
  response.json({ data: { productId: Number(request.params.productId), quantity } })
}

export async function removeItem(request, response) {
  const cartId = await getOrCreateCart(request.user.id)
  await pool.execute('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, request.params.productId])
  response.json({ data: { removed: true } })
}

export async function clearCart(request, response) {
  const cartId = await getOrCreateCart(request.user.id)
  await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId])
  response.json({ data: { cleared: true } })
}