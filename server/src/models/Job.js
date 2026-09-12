import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  skills: {
    type: [String],
    required: true,
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

jobSchema.pre('save', function updateTimestamp() {
  this.updatedAt = new Date()
})

jobSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() })
})

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema)

export default Job
