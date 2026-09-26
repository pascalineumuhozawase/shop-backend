import { validationResult } from 'express-validator'

export function validate(request, response, next) {
  const result = validationResult(request)
  if (!result.isEmpty()) {
    return response.status(400).json({
      message: 'Please check the submitted information.',
      errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
    })
  }
  next()
}