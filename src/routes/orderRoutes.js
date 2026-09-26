import { Router } from 'express'
import { body } from 'express-validator'
import { create, getMine, mine } from '../controllers/orderController.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.post('/', optionalAuth,
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required.'),
  body('items.*.productId').isInt({ min: 1 }), body('items.*.quantity').isInt({ min: 1, max: 99 }),
  body('customer.firstName').trim().notEmpty(), body('customer.lastName').trim().notEmpty(),
  body('customer.email').isEmail(), body('customer.phone').trim().notEmpty(),
  body('shippingAddress.address').trim().notEmpty(), body('shippingAddress.city').trim().notEmpty(),
  body('shippingAddress.country').trim().notEmpty(),
  body('paymentMethod').isIn(['cod', 'mock', 'mock_payment']), validate, asyncHandler(create))
router.get('/me', requireAuth, asyncHandler(mine))
router.get('/:id', requireAuth, asyncHandler(getMine))
export default router