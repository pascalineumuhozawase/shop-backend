import { Router } from 'express'
import { categories } from '../controllers/productController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const router = Router()
router.get('/', asyncHandler(categories))
export default router