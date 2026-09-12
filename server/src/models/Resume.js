import mongoose from 'mongoose'

const educationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    startYear: String,
    endYear: String,
    description: String,
  },
  { _id: false },
)

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    technologies: [String],
    link: String,
  },
  { _id: false },
)

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: String,
    company: String,
    startDate: String,
    endDate: String,
    description: String,
  },
  { _id: false },
)

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'My Resume',
    },
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
    },
    summary: String,
    education: [educationSchema],
    skills: [String],
    projects: [projectSchema],
    experience: [experienceSchema],
  },
  {
    timestamps: true,
  },
)

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema)

export default Resume
