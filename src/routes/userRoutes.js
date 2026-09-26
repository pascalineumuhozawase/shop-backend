import { Router } from 'express'
import { body } from 'express-validator'
import { updateProfile } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.patch('/me', requireAuth,
  body('firstName').optional().trim().notEmpty(), body('lastName').optional().trim().notEmpty(), body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ values: 'null' }).trim().isLength({ max: 40 }), validate, asyncHandler(updateProfile))
export default router