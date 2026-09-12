const skillAliases = {
  javascript: ['javascript', 'js'],
  nodejs: ['node.js', 'node js', 'nodejs'],
  react: ['react', 'react.js', 'reactjs'],
  mongodb: ['mongo db', 'mongodb', 'mongo'],
  express: ['express', 'express.js', 'expressjs'],
  restapi: ['rest api', 'restful api', 'rest apis'],
  machinelearning: ['machine learning', 'machine-learning'],
  deeplearning: ['deep learning', 'deep-learning'],
  scikitlearn: ['scikit-learn', 'scikit learn', 'sklearn'],
  datavisualization: ['data visualization', 'data visualisation'],
  tensorflow: ['tensorflow'],
  python: ['python'],
  typescript: ['typescript', 'ts'],
  html: ['html'],
  css: ['css'],
  git: ['git'],
  jwt: ['jwt'],
  sql: ['sql'],
  pandas: ['pandas'],
  numpy: ['numpy'],
  excel: ['excel'],
  statistics: ['statistics'],
  dataanalysis: ['data analysis'],
  docker: ['docker'],
  authentication: ['authentication'],
  authorization: ['authorization'],
  testing: ['testing', 'tests'],
  responsivewebdesign: ['responsive web design', 'responsive websites'],
  apis: ['apis', 'api'],
  databases: ['databases', 'database'],
}

const skillCatalog = Object.entries(skillAliases).map(([key, aliases]) => ({
  key,
  display: aliases[0],
  aliases,
}))

export function normalizeSkill(skill) {
  const normalized = String(skill || '')
    .toLowerCase()
    .replace(/[._/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const match = skillCatalog.find((item) => item.aliases.some((alias) => (
    alias.replace(/[._/-]/g, ' ').replace(/\s+/g, ' ').trim() === normalized
  )))

  return match?.key || normalized.replace(/[^a-z0-9]/g, '')
}

function collectText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(collectText).join(' ')
  if (value && typeof value.toObject === 'function') return collectText(value.toObject())
  if (value && typeof value === 'object') return Object.values(value).map(collectText).join(' ')
  return ''
}

function findCatalogSkills(text) {
  const lowerText = text.toLowerCase()
  return skillCatalog
    .filter((item) => item.aliases.some((alias) => lowerText.includes(alias.toLowerCase())))
    .map((item) => ({ key: item.key, display: item.display }))
}

function uniqueSkills(skills) {
  const result = []
  const seen = new Set()

  for (const skill of skills) {
    const key = normalizeSkill(skill)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push({ key, display: String(skill).trim() })
  }

  return result
}

export function collectResumeSkills(resume) {
  const directSkills = [
    ...(resume.skills || []),
    ...(resume.projects || []).flatMap((project) => project.technologies || []),
  ]
  const relevantText = collectText([
    resume.summary,
    resume.education,
    resume.experience,
  ])

  return uniqueSkills([
    ...directSkills,
    ...findCatalogSkills(relevantText).map((skill) => skill.display),
  ])
}

function getJobRequirements(job) {
  const explicit = uniqueSkills(job.skills || [])
  const descriptionSkills = findCatalogSkills(job.description || [])
    .filter((skill) => !explicit.some((required) => required.key === skill.key))

  return { explicit, descriptionSkills }
}

function getRecommendation(score) {
  if (score >= 80) return 'Strong match'
  if (score >= 60) return 'Good match, but improve the highlighted skills.'
  if (score >= 40) return 'Partial match. Consider learning the missing skills before applying.'
  return 'Low match. Build the highlighted skills before applying.'
}

function getLearningRecommendation(skill, job) {
  const description = job.description || ''
  if (description.toLowerCase().includes(skill.display.toLowerCase())) {
    return `Learn ${skill.display} fundamentals through a small project related to this role.`
  }
  return `Build practical ${skill.display} knowledge with a focused project for this role.`
}

function getReason(strengths, missingSkills, job) {
  const strengthText = strengths.length ? strengths.map((skill) => skill.display).join(', ') : 'none of the listed'
  const missingText = missingSkills.length ? missingSkills.map((skill) => skill.display).join(', ') : 'no listed skills'
  return `Your resume includes ${strengthText} for this role. Missing or weaker skills include ${missingText}.`
}

export function buildSkillMatches(resume, jobs) {
  const resumeSkills = collectResumeSkills(resume)
  const resumeSkillKeys = new Set(resumeSkills.map((skill) => skill.key))

  return jobs.map((job) => {
    const { explicit, descriptionSkills } = getJobRequirements(job)
    const strengths = explicit.filter((skill) => resumeSkillKeys.has(skill.key))
    const missingSkills = explicit.filter((skill) => !resumeSkillKeys.has(skill.key))
    const score = explicit.length ? Math.round((strengths.length / explicit.length) * 100) : 0
    const skillGaps = [
      ...missingSkills.map((skill) => ({
        skill: skill.display,
        priority: 'High',
        reason: `This skill is explicitly required for ${job.title}.`,
        learningRecommendation: getLearningRecommendation(skill, job),
      })),
      ...descriptionSkills
        .filter((skill) => !resumeSkillKeys.has(skill.key))
        .map((skill) => ({
          skill: skill.display,
          priority: 'Medium',
          reason: `This skill appears in the job description for ${job.title}.`,
          learningRecommendation: getLearningRecommendation(skill, job),
        })),
    ]

    return {
      jobId: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      score,
      strengths: strengths.map((skill) => skill.display),
      missingSkills: missingSkills.map((skill) => skill.display),
      skillGaps,
      learningRecommendations: skillGaps.map(({ skill, priority, learningRecommendation }) => ({
        skill,
        priority,
        learningRecommendation,
      })),
      reason: getReason(strengths, missingSkills, job),
      recommendation: getRecommendation(score),
    }
  }).sort((first, second) => second.score - first.score).slice(0, 5)
}
