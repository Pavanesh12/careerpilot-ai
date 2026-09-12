import mongoose from 'mongoose'
import { Router } from 'express'
import Resume from '../models/Resume.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const resumeFields = [
  'title',
  'personalInfo',
  'summary',
  'education',
  'skills',
  'projects',
  'experience',
]

function hasValidResumeId(id) {
  return mongoose.isValidObjectId(id)
}

function getResumeFields(body) {
  return Object.fromEntries(
    resumeFields.filter((field) => Object.prototype.hasOwnProperty.call(body, field)).map((field) => [field, body[field]]),
  )
}

function handleResumeError(error, res, next) {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resume data' })
  }

  return next(error)
}

router.use(authenticate)

router.post('/', async (req, res, next) => {
  try {
    const resume = await Resume.create({
      userId: req.user,
      ...getResumeFields(req.body || {}),
    })

    return res.status(201).json({
      success: true,
      message: 'Resume created successfully',
      resume,
    })
  } catch (error) {
    return handleResumeError(error, res, next)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user }).sort({ updatedAt: -1 })

    return res.json({
      success: true,
      resumes,
    })
  } catch (error) {
    return handleResumeError(error, res, next)
  }
})

router.get('/:id', async (req, res, next) => {
  if (!hasValidResumeId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid resume ID' })
  }

  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user,
    })

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    return res.json({
      success: true,
      resume,
    })
  } catch (error) {
    return handleResumeError(error, res, next)
  }
})

router.put('/:id', async (req, res, next) => {
  if (!hasValidResumeId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid resume ID' })
  }

  try {
    const resume = await Resume.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user,
      },
      getResumeFields(req.body || {}),
      {
        new: true,
        runValidators: true,
      },
    )

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    return res.json({
      success: true,
      message: 'Resume updated successfully',
      resume,
    })
  } catch (error) {
    return handleResumeError(error, res, next)
  }
})

router.delete('/:id', async (req, res, next) => {
  if (!hasValidResumeId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid resume ID' })
  }

  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    })

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    return res.json({
      success: true,
      message: 'Resume deleted successfully',
    })
  } catch (error) {
    return handleResumeError(error, res, next)
  }
})

export default router
