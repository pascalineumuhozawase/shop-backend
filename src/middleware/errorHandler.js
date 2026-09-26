export function notFound(request, response) {
  response.status(404).json({ message: 'The requested resource was not found.' })
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)
  const status = Number(error.status || error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500))
  if (status >= 500) console.error(error.message)
  response.status(status).json({
    message: status >= 500 ? 'An unexpected server error occurred.' : error.message || 'The submitted value conflicts with an existing record.',
  })
}