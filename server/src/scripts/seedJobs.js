import 'dotenv/config'
import mongoose from 'mongoose'
import Job from '../models/Job.js'

const sampleJobs = [
  {
    title: 'Frontend Developer',
    company: 'TechNova Solutions',
    location: 'Bengaluru, Karnataka',
    description: 'We are looking for a Frontend Developer to build responsive and user-friendly web applications. This role involves creating reusable React components, connecting frontend applications to REST APIs, improving performance, and working closely with designers and backend developers.\n\nWhat this job is about:\nYou will mainly work on the user-facing part of web applications. You will turn designs and requirements into responsive websites and applications using modern frontend technologies.',
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'REST API', 'Git'],
  },
  {
    title: 'Full Stack Developer',
    company: 'CodeSphere Technologies',
    location: 'Hyderabad, Telangana',
    description: 'We are looking for a Full Stack Developer to develop complete web applications from frontend to backend. The role includes building React interfaces, developing Node.js and Express APIs, working with databases, implementing authentication, and testing application functionality.\n\nWhat this job is about:\nYou will work on both the frontend and backend of web applications. You will build user interfaces, create APIs, connect databases, and help deliver complete working applications.',
    skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'REST API', 'JWT', 'Git'],
  },
  {
    title: 'AI/ML Engineer Intern',
    company: 'AICore Labs',
    location: 'Bengaluru, Karnataka',
    description: 'We are looking for an AI/ML Engineer Intern to work on machine learning and artificial intelligence applications. The role involves preparing datasets, developing machine learning models, evaluating model performance, and integrating AI capabilities into software applications.\n\nWhat this job is about:\nYou will work with data and machine learning models to solve practical problems. You may build predictive models, experiment with different algorithms, evaluate results, and integrate AI features into applications.',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'Data Analysis'],
  },
  {
    title: 'Backend Developer',
    company: 'CloudBridge Systems',
    location: 'Pune, Maharashtra',
    description: 'We are looking for a Backend Developer to develop secure and scalable server-side applications. Responsibilities include designing REST APIs, implementing authentication and authorization, working with databases, handling errors, and improving backend performance.\n\nWhat this job is about:\nYou will focus on the server-side of applications. You will create APIs, manage databases, implement business logic, and make sure applications communicate reliably with the frontend.',
    skills: ['Node.js', 'Express', 'MongoDB', 'REST API', 'JavaScript', 'JWT', 'Git'],
  },
  {
    title: 'Data Analyst',
    company: 'InsightWorks Analytics',
    location: 'Chennai, Tamil Nadu',
    description: 'We are looking for a Data Analyst to analyze datasets and generate useful insights for business decisions. The role includes data cleaning, exploratory data analysis, creating reports, identifying trends, and presenting findings using visualization tools.\n\nWhat this job is about:\nYou will work with data to understand patterns and answer business questions. You will clean datasets, analyze information, create visualizations, and communicate useful findings.',
    skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Data Visualization', 'Excel', 'Statistics'],
  },
  {
    title: 'Machine Learning Engineer',
    company: 'NeuralStack Technologies',
    location: 'Remote',
    description: 'We are looking for a Machine Learning Engineer to develop and improve machine learning solutions. The role involves preparing data, training models, evaluating results, experimenting with machine learning algorithms, and integrating trained models into production applications.\n\nWhat this job is about:\nYou will develop machine learning systems that can learn from data and make predictions or decisions. You will work across data preparation, model development, evaluation, and deployment.',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'Scikit-learn', 'TensorFlow', 'Pandas', 'NumPy', 'Git'],
  },
]

async function seedJobs() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured')
  }

  await mongoose.connect(process.env.MONGODB_URI)

  let added = 0
  for (const sampleJob of sampleJobs) {
    const exists = await Job.exists({
      title: sampleJob.title,
      company: sampleJob.company,
    })

    if (!exists) {
      await Job.create(sampleJob)
      added += 1
    }
  }

  console.log(`${added} sample jobs added successfully.`)
  await mongoose.disconnect()
}

seedJobs().catch(async () => {
  await mongoose.disconnect()
  console.error('Unable to seed sample jobs.')
  process.exitCode = 1
})
