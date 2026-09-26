import { createOrder, getOrderById, listOrdersForUser } from '../services/orderService.js'

export async function create(request, response) {
  const order = await createOrder(request.user?.id ?? null, request.body)
  response.status(201).json({ data: { order } })
}

export async function mine(request, response) {
  response.json({ data: { items: await listOrdersForUser(request.user.id) } })
}

export async function getMine(request, response) {
  const ownerId = request.user.role === 'admin' ? null : request.user.id
  const order = await getOrderById(request.params.id, ownerId)
  if (!order) return response.status(404).json({ message: 'Order not found.' })
  response.json({ data: { order } })
}