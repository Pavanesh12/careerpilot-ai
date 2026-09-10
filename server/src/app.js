import cors from 'cors'
import express from 'express'
import healthRoutes from './routes/health.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
)
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'AI Resume Builder API is running' })
})
app.use('/api/health', healthRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app