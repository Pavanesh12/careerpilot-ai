import jwt from 'jsonwebtoken'
import { Router } from 'express'
import User from '../models/User.js'
import { getJwtSecret } from '../config/auth.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

function createToken(userId) {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '7d' })
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    location: user.location || '',
    linkedin: user.linkedin || '',
    github: user.github || '',
    experienceLevel: user.experienceLevel || '',
    createdAt: user.createdAt,
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {}

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({ message: 'A valid email is required' })
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    })

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: publicUser(user),
      token: createToken(user._id.toString()),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    const passwordMatches = user ? await user.comparePassword(password) : false

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    return res.json({
      success: true,
      message: 'Login successful',
      user: publicUser(user),
      token: createToken(user._id.toString()),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user)

    if (!user) {
      return res.status(401).json({ message: 'Authenticated user was not found' })
    }

    return res.json({
      success: true,
      user: publicUser(user),
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, location, linkedin, github, experienceLevel } = req.body || {}

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const user = await User.findByIdAndUpdate(
      req.user,
      {
        name: name.trim(),
        phone: typeof phone === 'string' ? phone.trim() : '',
        location: typeof location === 'string' ? location.trim() : '',
        linkedin: typeof linkedin === 'string' ? linkedin.trim() : '',
        github: typeof github === 'string' ? github.trim() : '',
        experienceLevel: typeof experienceLevel === 'string' ? experienceLevel.trim() : '',
      },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({ success: true, message: 'Profile updated successfully', user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
})

router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {}

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Current password, new password, and confirmation are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' })
    }

    const user = await User.findById(req.user).select('+password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    user.password = newPassword
    await user.save()

    return res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    return next(error)
  }
})

export default router
