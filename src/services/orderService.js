import pool from '../config/db.js'
import { findProductById } from '../models/productModel.js'

const shippingFee = Number(process.env.SHIPPING_FEE || 8)
const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD || 100)

export async function createOrder(userId, payload) {
  const items = Array.isArray(payload.items) ? payload.items : []
  if (!items.length) {
    const error = new Error('Your order must contain at least one item.')
    error.status = 400
    throw error
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const normalizedItems = []
    let subtotal = 0
    for (const item of items) {
      const quantity = Number(item.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        const error = new Error('Each item quantity must be between 1 and 99.')
        error.status = 400
        throw error
      }
      const product = await findProductById(item.productId, { connection })
      if (!product) {
        const error = new Error(`Product ${item.productId} is unavailable.`)
        error.status = 400
        throw error
      }
      if (product.stock < quantity) {
        const error = new Error(`${product.name} does not have enough stock available.`)
        error.status = 409
        throw error
      }
      const lineTotal = Number((product.price * quantity).toFixed(2))
      subtotal += lineTotal
      normalizedItems.push({ product, quantity, lineTotal })
    }
    subtotal = Number(subtotal.toFixed(2))
    const deliveryFee = subtotal >= freeShippingThreshold ? 0 : shippingFee
    const total = Number((subtotal + deliveryFee).toFixed(2))
    const method = payload.paymentMethod === 'mock' || payload.paymentMethod === 'mock_payment' ? 'mock' : 'cod'
    const customer = payload.customer || {}
    const address = payload.shippingAddress || {}
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_region, shipping_postal_code,
        shipping_country, subtotal, shipping_fee, total, payment_method, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, fullName, customer.email, customer.phone, address.address, address.city,
        address.region || null, address.postalCode || null, address.country, subtotal,
        deliveryFee, total, method, method === 'mock' ? 'mock_paid' : 'pending'],
    )
    const orderId = orderResult.insertId
    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, image_url, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product.id, item.product.name, item.product.image, item.product.price, item.quantity, item.lineTotal],
      )
      const [updated] = await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.quantity, item.product.id, item.quantity],
      )
      if (!updated.affectedRows) {
        const error = new Error(`${item.product.name} is no longer available in the requested quantity.`)
        error.status = 409
        throw error
      }
    }
    await connection.execute(
      'INSERT INTO payments (order_id, method, status, amount, reference) VALUES (?, ?, ?, ?, ?)',
      [orderId, method, method === 'mock' ? 'mock_paid' : 'pending', total, method === 'mock' ? `MOCK-${orderId}` : null],
    )
    if (userId) await connection.execute('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId])
    await connection.commit()
    return getOrderById(orderId, userId)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function getOrderById(orderId, userId = null) {
  const ownerFilter = userId === null ? '' : 'AND o.user_id = ?'
  const params = userId === null ? [orderId] : [orderId, userId]
  const [orders] = await pool.execute(
    `SELECT o.id, o.user_id AS "userId", o.customer_name AS "customerName", o.customer_email AS email,
      o.customer_phone AS phone, o.shipping_address AS address, o.shipping_city AS city,
      o.shipping_region AS region, o.shipping_postal_code AS "postalCode", o.shipping_country AS country,
      o.subtotal, o.shipping_fee AS "shippingFee", o.total, o.payment_method AS "paymentMethod",
      o.payment_status AS "paymentStatus", o.status, o.created_at AS "createdAt"
     FROM orders o WHERE o.id = ? ${ownerFilter}`,
    params,
  )
  if (!orders.length) return null
  const [items] = await pool.execute(
    `SELECT id, product_id AS "productId", product_name AS name, image_url AS image,
      unit_price AS price, quantity, line_total AS "lineTotal" FROM order_items WHERE order_id = ?`,
    [orderId],
  )
  return { ...orders[0], items }
}

export async function listOrdersForUser(userId) {
  const [orders] = await pool.execute('SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId])
  return Promise.all(orders.map(({ id }) => getOrderById(id, userId)))
}