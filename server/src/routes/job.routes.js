import mongoose from 'mongoose'
import { Router } from 'express'
import Job from '../models/Job.js'
import { requireAdmin } from '../middleware/admin.js'

const router = Router()
const jobFields = ['title', 'company', 'location', 'description', 'skills']

function hasValidJobId(id) {
  return mongoose.isValidObjectId(id)
}

function getJobFields(body) {
  return Object.fromEntries(
    jobFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  )
}

function validateJobFields(fields) {
  const requiredTextFields = ['title', 'company', 'location', 'description']

  for (const field of requiredTextFields) {
    if (typeof fields[field] !== 'string' || !fields[field].trim()) {
      return `${field} is required`
    }
  }

  if (!Array.isArray(fields.skills) || fields.skills.length === 0) {
    return 'skills must be a non-empty array'
  }

  if (fields.skills.some((skill) => typeof skill !== 'string' || !skill.trim())) {
    return 'skills must contain non-empty strings'
  }

  return null
}

function handleJobError(error, res, next) {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid job data' })
  }

  return next(error)
}

router.get('/', async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 })

    return res.json({
      success: true,
      jobs,
    })
  } catch (error) {
    return handleJobError(error, res, next)
  }
})

router.get('/:id', async (req, res, next) => {
  if (!hasValidJobId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid job ID' })
  }

  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    return res.json({
      success: true,
      job,
    })
  } catch (error) {
    return handleJobError(error, res, next)
  }
})

router.post('/', requireAdmin, async (req, res, next) => {
  const fields = getJobFields(req.body || {})
  const validationMessage = validateJobFields(fields)

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage })
  }

  try {
    const job = await Job.create({
      ...fields,
      title: fields.title.trim(),
      company: fields.company.trim(),
      location: fields.location.trim(),
      description: fields.description.trim(),
      skills: fields.skills.map((skill) => skill.trim()),
    })

    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job,
    })
  } catch (error) {
    return handleJobError(error, res, next)
  }
})

router.put('/:id', requireAdmin, async (req, res, next) => {
  if (!hasValidJobId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid job ID' })
  }

  const fields = getJobFields(req.body || {})
  const validationMessage = validateJobFields(fields)

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage })
  }

  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        ...fields,
        title: fields.title.trim(),
        company: fields.company.trim(),
        location: fields.location.trim(),
        description: fields.description.trim(),
        skills: fields.skills.map((skill) => skill.trim()),
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    return res.json({
      success: true,
      message: 'Job updated successfully',
      job,
    })
  } catch (error) {
    return handleJobError(error, res, next)
  }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  if (!hasValidJobId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid job ID' })
  }

  try {
    const job = await Job.findByIdAndDelete(req.params.id)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    return res.json({
      success: true,
      message: 'Job deleted successfully',
    })
  } catch (error) {
    return handleJobError(error, res, next)
  }
})

export default router
