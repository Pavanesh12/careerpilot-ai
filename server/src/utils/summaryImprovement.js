const skillNames = {
  javascript: 'JavaScript',
  python: 'Python',
  typescript: 'TypeScript',
  react: 'React',
  node: 'Node.js',
  nodejs: 'Node.js',
  java: 'Java',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  mongodb: 'MongoDB',
}

function capitalizeSentence(sentence) {
  const trimmed = sentence.trim()
  if (!trimmed) return ''
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`
}

function displaySkill(skill) {
  const value = String(skill || '').trim()
  return skillNames[value.toLowerCase()] || capitalizeSentence(value)
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

function getResumeContext(resume = {}) {
  const skills = [...new Set((resume.skills || []).map(displaySkill).filter(Boolean))]
  const technologies = (resume.projects || [])
    .flatMap((project) => project.technologies || [])
    .map(displaySkill)
    .filter(Boolean)
  const allSkills = [...new Set([...skills, ...technologies])]
  const projectTitles = (resume.projects || []).map((project) => cleanText(project.title)).filter(Boolean)
  const experienceTitles = (resume.experience || []).map((item) => cleanText(item.jobTitle)).filter(Boolean)
  const degree = cleanText((resume.education || [])[0]?.degree)

  return {
    summary: cleanText(resume.summary),
    skills: allSkills,
    projectTitles,
    experienceTitles,
    degree,
  }
}

function skillPhrase(skills) {
  if (!skills.length) return ''
  if (skills.length === 1) return skills[0]
  if (skills.length === 2) return `${skills[0]} and ${skills[1]}`
  return `${skills.slice(0, -1).join(', ')}, and ${skills.at(-1)}`
}

function normalizeOriginalSummary(summary) {
  let normalized = cleanText(summary)
    .replace(/^i am a good developer$/i, 'Motivated and adaptable developer focused on building practical software solutions.')
    .replace(/\bi am\b/gi, 'I am')
    .replace(/\bi like\b/gi, 'I enjoy')
    .replace(/\bi know\b/gi, 'I have knowledge of')
    .replace(/\s+/g, ' ')
  Object.keys(skillNames).forEach((skill) => {
    normalized = normalized.replace(new RegExp(`\\b${skill}\\b`, 'gi'), skillNames[skill])
  })
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map(capitalizeSentence)
    .join(' ')
    .replace(/[!?]+$/, '')
}

export function buildSummaryAlternatives(resume = {}) {
  const context = getResumeContext(resume)
  const skills = skillPhrase(context.skills)
  const original = normalizeOriginalSummary(context.summary)
  const projectText = context.projectTitles.length
    ? `through projects such as ${context.projectTitles.slice(0, 2).join(' and ')}`
    : ''
  const experienceText = context.experienceTitles.length
    ? `with experience as a ${context.experienceTitles[0]}`
    : ''
  const educationText = context.degree ? ` with a background in ${context.degree}` : ''

  const professional = skills
    ? `Motivated software developer with skills in ${skills}${educationText}. ${projectText ? `Interested in applying these skills ${projectText} and contributing to practical software solutions.` : 'Focused on building practical software solutions and continuing to grow as a developer.'}`
    : `${original || 'Motivated and adaptable developer focused on building practical software solutions.'} Interested in contributing to thoughtful, user-focused applications.`

  const technical = skills
    ? `Developer with practical knowledge of ${skills}${projectText ? ` and experience exploring projects such as ${context.projectTitles.slice(0, 2).join(' and ')}` : ''}. Interested in developing reliable applications, improving technical skills, and solving software problems.`
    : `${original || 'Developer focused on building practical software solutions.'} Interested in developing reliable applications and strengthening technical skills.`

  const careerBase = original || 'Motivated and adaptable developer focused on building practical software solutions.'
  const careerFocused = `${careerBase.replace(/[.!?]?$/, '.')}${experienceText ? ` ${experienceText}.` : ''} Eager to learn, contribute to a collaborative team, and grow through meaningful development work.`

  return [
    { title: 'Professional', summary: professional.replace(/\s+/g, ' ').trim() },
    { title: 'Technical', summary: technical.replace(/\s+/g, ' ').trim() },
    { title: 'Career-focused', summary: careerFocused.replace(/\s+/g, ' ').trim() },
  ]
}

export function improveSummaryFallback(summary) {
  return buildSummaryAlternatives({ summary })[0].summary
}

export function buildSummarySuggestions(summary) {
  return [
    'Keep the summary concise and focused on your target role.',
    'Highlight the skills and experience most relevant to the position.',
    'Review the wording and add specific achievements when available.',
  ]
}
