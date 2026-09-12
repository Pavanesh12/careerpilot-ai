import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  resumeFile: {
    originalName: String,
    mimeType: String,
    size: Number,
  },
  applicantName: String,
  applicantEmail: String,
  phone: String,
  location: String,
  experienceLevel: String,
  workPreference: String,
  coverNote: String,
  status: {
    type: String,
    enum: ['Applied', 'Reviewing', 'Rejected'],
    required: true,
    default: 'Applied',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true })

applicationSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date()
})

applicationSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() })
})

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema)

export default Application
