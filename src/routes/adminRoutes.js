import { Router } from 'express'
import { body } from 'express-validator'
import { customers, listOrders, stats, updateOrder } from '../controllers/adminController.js'
import { adminCategories, create, createCategory, adminList, remove, removeCategory, update, updateCategory } from '../controllers/productController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { uploadProductImage } from '../middleware/upload.js'

const router = Router()
router.use(requireAuth, requireAdmin)
router.get('/stats', asyncHandler(stats))
router.get('/products', asyncHandler(adminList))
router.post('/products/images', uploadProductImage.single('image'), (request, response) => {
	if (!request.file) return response.status(400).json({ message: 'Choose a product image to upload.' })
	response.status(201).json({ data: { imageUrl: `${request.protocol}://${request.get('host')}/uploads/${request.file.filename}` } })
})
router.post('/products', body('name').trim().notEmpty(), body('categoryId').isInt({ min: 1 }), body('price').isFloat({ min: 0 }), body('stock').optional().isInt({ min: 0 }), validate, asyncHandler(create))
router.patch('/products/:id', body('price').optional().isFloat({ min: 0 }), body('stock').optional().isInt({ min: 0 }), validate, asyncHandler(update))
router.delete('/products/:id', asyncHandler(remove))
router.get('/categories', asyncHandler(adminCategories))
router.post('/categories', body('name').trim().notEmpty(), validate, asyncHandler(createCategory))
router.patch('/categories/:id', asyncHandler(updateCategory))
router.delete('/categories/:id', asyncHandler(removeCategory))
router.get('/orders', asyncHandler(listOrders))
router.patch('/orders/:id', body('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']), body('paymentStatus').optional().isIn(['paid']), validate, asyncHandler(updateOrder))
router.get('/customers', asyncHandler(customers))
export default router