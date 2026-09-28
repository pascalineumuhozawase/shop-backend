import { Router } from 'express'
import { param } from 'express-validator'
import { add, list, remove } from '../controllers/wishlistController.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)
router.get('/', asyncHandler(list))
router.put('/items/:productId', param('productId').isInt({ min: 1 }), validate, asyncHandler(add))
router.delete('/items/:productId', param('productId').isInt({ min: 1 }), validate, asyncHandler(remove))
export default router
