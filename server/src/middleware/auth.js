import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../config/auth.js'

export function authenticate(req, res, next) {
  const authorization = req.headers.authorization

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required' })
  }

  const token = authorization.slice(7)

  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.user = decoded.id
    next()
  } catch (error) {
    if (error.statusCode === 500) {
      return next(error)
    }

    return res.status(401).json({ message: 'Invalid or expired authentication token' })
  }
}
