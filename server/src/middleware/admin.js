import User from '../models/User.js'
import { authenticate } from './auth.js'

export function requireAdmin(req, res, next) {
  authenticate(req, res, async () => {
    try {
      const user = await User.findById(req.user)

      if (!user) {
        return res.status(401).json({ message: 'Authenticated user was not found' })
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' })
      }

      req.user = user
      return next()
    } catch (error) {
      return next(error)
    }
  })
}
