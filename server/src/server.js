import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/db.js'

const port = process.env.PORT || 5000

try {
  await connectDatabase()
} catch (error) {
  console.error(`MongoDB connection failed: ${error.message}`)
  console.error('The API will still start. Check MONGODB_URI before using database features.')
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})