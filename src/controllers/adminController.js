import pool from '../config/db.js'
import { getOrderById } from '../services/orderService.js'

function pageOptions(query) {
  return { page: Math.max(1, Number.parseInt(query.page, 10) || 1), limit: Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 12)) }
}

export async function stats(request, response) {
  const [[products]] = await pool.execute('SELECT COUNT(*) AS total FROM products WHERE is_active = TRUE')
  const [[orders]] = await pool.execute('SELECT COUNT(*) AS total FROM orders')
  const [[customers]] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'customer' AND is_active = TRUE")
  const [[revenue]] = await pool.execute("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status <> 'cancelled' AND payment_status = 'paid'")
  response.json({ data: { products: products.total, orders: orders.total, customers: customers.total, revenue: revenue.total } })
}

export async function listOrders(request, response) {
  const { page, limit } = pageOptions(request.query)
  const search = String(request.query.search || '').trim()
  const filters = []
  const values = []
  if (search) { filters.push('(CAST(o.id AS TEXT) ILIKE ? OR o.customer_name ILIKE ? OR o.customer_email ILIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`) }
  if (request.query.status) { filters.push('o.status = ?'); values.push(request.query.status) }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const [rows] = await pool.execute(`SELECT o.id FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit])
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM orders o ${where}`, values)
  response.json({ data: { items: await Promise.all(rows.map(({ id }) => getOrderById(id))), total, page, pages: Math.max(1, Math.ceil(total / limit)) } })
}

export async function updateOrder(request, response) {
  const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  const status = request.body.status ? String(request.body.status).toLowerCase() : null
  const paymentStatus = request.body.paymentStatus ? String(request.body.paymentStatus).toLowerCase() : null
  if (!status && !paymentStatus) return response.status(400).json({ message: 'Provide an order status or payment update.' })
  if (status && !allowed.includes(status)) return response.status(400).json({ message: 'Order status is not supported.' })
  if (paymentStatus && paymentStatus !== 'paid') return response.status(400).json({ message: 'Payment status is not supported.' })
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [orders] = await connection.execute('SELECT status, payment_status AS "paymentStatus", payment_method AS "paymentMethod" FROM orders WHERE id = ? FOR UPDATE', [request.params.id])
    if (!orders.length) {
      await connection.rollback()
      return response.status(404).json({ message: 'Order not found.' })
    }
    const order = orders[0]
    const nextStatus = status || order.status
    if (order.status === 'cancelled' && status && status !== 'cancelled') {
      await connection.rollback()
      return response.status(409).json({ message: 'A cancelled order cannot be reopened.' })
    }
    if (status === 'cancelled' && order.status !== 'cancelled' && order.paymentStatus === 'paid') {
      await connection.rollback()
      return response.status(409).json({ message: 'A paid order cannot be cancelled.' })
    }
    if (paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      if (order.paymentMethod !== 'cod') {
        await connection.rollback()
        return response.status(409).json({ message: 'Only cash-on-delivery orders can be marked paid manually.' })
      }
      if (nextStatus !== 'delivered') {
        await connection.rollback()
        return response.status(409).json({ message: 'Mark the order delivered before recording payment.' })
      }
    }
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const [items] = await connection.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [request.params.id])
      for (const item of items) {
        if (item.product_id) await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id])
      }
      if (order.paymentStatus === 'mock_paid') {
        await connection.execute("UPDATE orders SET payment_status = 'refunded' WHERE id = ?", [request.params.id])
        await connection.execute("UPDATE payments SET status = 'refunded' WHERE order_id = ?", [request.params.id])
      }
    }
    if (status) await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, request.params.id])
    if (paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      const [payment] = await connection.execute("UPDATE payments SET status = 'paid' WHERE order_id = ? AND method = 'cod' AND status = 'pending'", [request.params.id])
      if (!payment.affectedRows) {
        await connection.rollback()
        return response.status(409).json({ message: 'The pending payment record could not be found.' })
      }
      await connection.execute("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [request.params.id])
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
  response.json({ data: await getOrderById(request.params.id) })
}

export async function customers(request, response) {
  const { page, limit } = pageOptions(request.query)
  const search = String(request.query.search || '').trim()
  const where = search ? 'WHERE u.role = \'customer\' AND (u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.email ILIKE ?)' : "WHERE u.role = 'customer'"
  const values = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
  const [rows] = await pool.execute(
    `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
      u.created_at AS "createdAt", COUNT(o.id) AS "orderCount", COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END), 0) AS "totalSpent"
     FROM users u LEFT JOIN orders o ON o.user_id = u.id ${where}
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit],
  )
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM users u ${where}`, values)
  response.json({ data: { items: rows, total, page, pages: Math.max(1, Math.ceil(total / limit)) } })
}