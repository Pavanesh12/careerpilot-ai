import mongoose from 'mongoose'
import { Router } from 'express'
import Application from '../models/Application.js'
import Resume from '../models/Resume.js'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import multer from 'multer'

const router = Router()
const allowedStatuses = ['Applied', 'Reviewing', 'Rejected']
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const extension = file.originalname.toLowerCase().split('.').pop()
    if (!['pdf', 'doc', 'docx'].includes(extension) || !allowed.includes(file.mimetype)) {
      callback(new Error('INVALID_RESUME_FILE'))
      return
    }
    callback(null, true)
  },
})
function handleUpload(req, res, next) {
  upload.single('resumeFile')(req, res, (error) => {
    if (error) return handleApplicationError(error, res, next)
    return next()
  })
}

async function normalizeLegacyStatuses() {
  await Application.collection.updateMany(
    { status: { $in: ['Interview', 'Selected'] } },
    { $set: { status: 'Reviewing' } },
  )
}

function hasValidId(id) {
  return mongoose.isValidObjectId(id)
}

function handleApplicationError(error, res, next) {
  if (error.message === 'INVALID_RESUME_FILE' || error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Please upload a PDF, DOC, or DOCX file under 5 MB.' })
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: 'You have already applied to this job' })
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid application data' })
  }

  return next(error)
}

router.use(authenticate)

router.get('/', async (req, res, next) => {
  try {
    await normalizeLegacyStatuses()
    const applications = await Application.find({ userId: req.user })
      .populate('jobId', 'title company location')
      .sort({ appliedAt: -1 })

    return res.json({
      success: true,
      applications,
    })
  } catch (error) {
    return handleApplicationError(error, res, next)
  }
})

router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    await normalizeLegacyStatuses()
    const applications = await Application.find()
      .populate('userId', 'name email')
      .populate('jobId', 'title company location')
      .sort({ appliedAt: -1 })

    return res.json({ success: true, applications })
  } catch (error) {
    return handleApplicationError(error, res, next)
  }
})

router.get('/:id', async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid application ID' })
  }

  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user,
    }).populate('jobId', 'title company location')

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    return res.json({
      success: true,
      application,
    })
  } catch (error) {
    return handleApplicationError(error, res, next)
  }
})

router.post('/', handleUpload, async (req, res, next) => {
  const { jobId, resumeId, applicantName, applicantEmail, phone, location, experienceLevel, workPreference, coverNote } = req.body || {}

  if (!jobId || !hasValidId(jobId)) {
    return res.status(400).json({ message: 'A valid jobId is required' })
  }
  if (!resumeId && !req.file) return res.status(400).json({ message: 'Please select or upload a resume.' })
  if (resumeId && !hasValidId(resumeId)) return res.status(400).json({ message: 'Please select a valid resume.' })

  try {
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.user }).select('_id')
      if (!resume) return res.status(404).json({ message: 'Selected resume was not found.' })
    }
    const application = await Application.create({
      userId: req.user,
      jobId,
      status: 'Applied',
      resumeId: resumeId || undefined,
      resumeFile: req.file ? { originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size } : undefined,
      applicantName,
      applicantEmail,
      phone,
      location,
      experienceLevel,
      workPreference,
      coverNote,
    })

    await application.populate('jobId', 'title company location')

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    })
  } catch (error) {
    return handleApplicationError(error, res, next)
  }
})

router.put('/:id/status', requireAdmin, async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid application ID' })
  }

  const { status } = req.body || {}
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid application status' })
  }

  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id },
      { status },
      {
        new: true,
        runValidators: true,
      },
    ).populate('jobId', 'title company location')

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    return res.json({
      success: true,
      message: 'Application status updated successfully',
      application,
    })
  } catch (error) {
    return handleApplicationError(error, res, next)
  }
})

router.put('/:id', async (req, res) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid application ID' })
  }

  if (req.body?.status && !allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid application status' })
  }

  return res.status(403).json({ message: 'Admin access required' })
})

router.delete('/:id', async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid application ID' })
  }

  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    })

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    return res.json({
      success: true,
      message: 'Application deleted successfully',
    })
  } catch (error) {
    return handleApplicationError(error, res, next)
  }
})

export default router
