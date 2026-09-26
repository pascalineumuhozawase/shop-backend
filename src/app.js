import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim())

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: origins, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(path.resolve(currentDirectory, '../uploads'), { dotfiles: 'deny', index: false, maxAge: '1d' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { skip: (request) => request.url === '/api/health' }))

app.get('/api/health', (request, response) => response.json({ data: { status: 'ok' } }))
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use(notFound)
app.use(errorHandler)

export default app