import { Router } from 'express'
import { body } from 'express-validator'
import { login, logout, me, register, updateProfile } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.post('/register',
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 40 }), validate, asyncHandler(register))
router.post('/login', body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate, asyncHandler(login))
router.get('/me', requireAuth, asyncHandler(me))
router.post('/logout', requireAuth, asyncHandler(logout))
router.patch('/profile', requireAuth,
  body('firstName').optional().trim().notEmpty(), body('lastName').optional().trim().notEmpty(), body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ values: 'null' }).trim().isLength({ max: 40 }), validate, asyncHandler(updateProfile))

export default router