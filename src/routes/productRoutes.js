import { Router } from 'express'
import { get, list } from '../controllers/productController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()
router.get('/', asyncHandler(list))
router.get('/:id', asyncHandler(get))
export default router