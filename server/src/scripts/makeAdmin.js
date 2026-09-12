import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { connectDatabase } from '../config/db.js'

const email = process.argv[2]?.trim().toLowerCase()

if (!email) {
  console.error('Usage: npm run make-admin -- user@example.com')
  process.exitCode = 1
} else {
  try {
    await connectDatabase()
    const user = await User.findOne({ email })

    if (!user) {
      console.error('User not found.')
      process.exitCode = 1
    } else {
      user.role = 'admin'
      await user.save()
      console.log('User role updated to admin.')
    }
  } catch {
    console.error('Unable to update user role.')
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}
