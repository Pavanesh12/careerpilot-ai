import cors from 'cors'
import express from 'express'
import aiRoutes from './routes/ai.routes.js'
import applicationRoutes from './routes/application.routes.js'
import authRoutes from './routes/auth.routes.js'
import healthRoutes from './routes/health.routes.js'
import jobRoutes from './routes/job.routes.js'
import resumeRoutes from './routes/resume.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
const allowedOrigins = new Set(
  ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(Boolean),
)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
  }),
)
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'AI Resume Builder API is running' })
})
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/resumes', resumeRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app