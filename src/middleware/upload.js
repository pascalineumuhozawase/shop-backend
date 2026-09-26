import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import multer from 'multer'

const uploadDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads')
mkdirSync(uploadDirectory, { recursive: true })

const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }

export const uploadProductImage = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (request, file, callback) => callback(null, `${randomUUID()}${extensions[file.mimetype] || ''}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (request, file, callback) => {
    if (!extensions[file.mimetype]) {
      const error = new Error('Product images must be JPEG, PNG, WebP, or GIF.')
      error.status = 400
      return callback(error)
    }
    callback(null, true)
  },
})
