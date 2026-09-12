import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { connectDatabase } from '../config/db.js'

const adminEmail = 'admin@careerpilot.com'
const newPassword = process.argv[2]

if (!newPassword) {
  console.error('Usage: npm run reset-admin-password -- <new-password>')
  process.exitCode = 1
} else if (newPassword.length < 6) {
  console.error('The new password must be at least 6 characters long.')
  process.exitCode = 1
} else {
  try {
    await connectDatabase()

    const user = await User.findOne({ email: adminEmail }).select('+password')

    if (!user) {
      console.error(`Admin user ${adminEmail} was not found.`)
      process.exitCode = 1
    } else if (user.role !== 'admin') {
      console.error(`User ${adminEmail} exists but is not an admin. Run make-admin first.`)
      process.exitCode = 1
    } else {
      const passwordHash = await bcrypt.hash(newPassword, 10)
      await User.updateOne({ _id: user._id }, { $set: { password: passwordHash } })
      console.log(`Password reset successfully for ${adminEmail}.`)
    }
  } catch (error) {
    console.error(`Unable to reset the admin password: ${error.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}
