import { Router } from 'express'
import { addItem, clearCart, getCart, removeItem, updateItem } from '../controllers/cartController.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()
router.use(requireAuth)
router.get('/', asyncHandler(getCart))
router.post('/items', asyncHandler(addItem))
router.patch('/items/:productId', asyncHandler(updateItem))
router.delete('/items/:productId', asyncHandler(removeItem))
router.delete('/', asyncHandler(clearCart))
export default router