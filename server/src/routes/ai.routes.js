import OpenAI from 'openai'
import { Router } from 'express'
import Job from '../models/Job.js'
import Resume from '../models/Resume.js'
import { authenticate } from '../middleware/auth.js'
import { buildSkillMatches } from '../utils/skillMatching.js'
import { buildSummaryAlternatives, buildSummarySuggestions } from '../utils/summaryImprovement.js'

const router = Router()
const MAX_SUMMARY_LENGTH = 2000

const improvementInstructions = `
Create exactly three concise, professional resume summary alternatives using
only the user's provided summary, skills, projects, education, and experience.
Do not invent companies, job titles, years, technologies, achievements,
percentages, users, certifications, or experience. Make the alternatives
different in style and label them Professional, Technical, and Career-focused.
Return only valid JSON in this shape:
{"improvedSummary":"the best alternative","alternatives":[{"title":"Professional","summary":"..."},{"title":"Technical","summary":"..."},{"title":"Career-focused","summary":"..."}]}
`.trim()

const matchingInstructions = `
Compare the user's actual resume information with each available job.
Consider skills, projects, education, and experience when relevant. For every
job, generate a match score from 0 to 100, briefly explain why the job matches,
identify missing or weaker skills, and recommend whether the user should
consider applying. Do not invent skills, education, experience, or projects that
are not present in the resume.

Return only valid JSON in this exact shape:
{
  "matches": [
    {
      "jobId": "job id",
      "score": 85,
      "reason": "brief explanation",
      "missingSkills": ["skill"],
      "recommendation": "Strong match"
    }
  ]
}
Return one match for each provided job. Use an integer score from 0 to 100,
an array of strings for missingSkills, and a short recommendation.
`.trim()

function parseMatches(output) {
  const jsonText = output.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  const parsed = JSON.parse(jsonText)

  if (!parsed || !Array.isArray(parsed.matches)) {
    throw new Error('Invalid AI match response')
  }

  return parsed.matches
}

function cleanMatches(matches, jobs) {
  const jobMap = new Map(jobs.map((job) => [job._id.toString(), job]))

  return matches
    .filter((match) => jobMap.has(String(match.jobId)))
    .map((match) => {
      const job = jobMap.get(String(match.jobId))
      return {
      jobId: String(match.jobId),
      title: job.title,
      company: job.company,
      location: job.location,
      score: Math.max(0, Math.min(100, Math.round(Number(match.score)))),
      reason: typeof match.reason === 'string' ? match.reason : 'Match details unavailable',
      missingSkills: Array.isArray(match.missingSkills)
        ? match.missingSkills.filter((skill) => typeof skill === 'string')
        : [],
      recommendation: typeof match.recommendation === 'string'
        ? match.recommendation
        : 'Consider reviewing this opportunity',
      }
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 5)
}

router.post('/improve-summary', authenticate, async (req, res) => {
  const { summary, resume: submittedResume } = req.body || {}

  if (typeof summary !== 'string' || !summary.trim()) {
    return res.status(400).json({ message: 'A non-empty summary is required' })
  }

  if (summary.length > MAX_SUMMARY_LENGTH) {
    return res.status(400).json({ message: `Summary must be ${MAX_SUMMARY_LENGTH} characters or fewer` })
  }

  const savedResume = await Resume.findOne({ userId: req.user }).sort({ updatedAt: -1 })
  const resumeData = {
    ...(savedResume?.toObject() || {}),
    ...(submittedResume || {}),
    summary,
  }

  if (!process.env.OPENAI_API_KEY) {
    const alternatives = buildSummaryAlternatives(resumeData)
    return res.json({
      success: true,
      source: 'skill-based',
      improvedSummary: alternatives[0].summary,
      alternatives,
      suggestions: buildSummarySuggestions(summary),
    })
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      instructions: improvementInstructions,
      input: JSON.stringify(resumeData),
    })
    const parsed = JSON.parse(response.output_text?.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''))
    const alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives
      .filter((item) => item && typeof item.title === 'string' && typeof item.summary === 'string')
      .slice(0, 3) : []
    const improvedSummary = typeof parsed.improvedSummary === 'string'
      ? parsed.improvedSummary.trim()
      : alternatives[0]?.summary

    if (!improvedSummary) {
      return res.status(502).json({ message: 'The AI service returned an empty response' })
    }

    return res.json({
      success: true,
      source: 'openai',
      improvedSummary,
      alternatives,
      suggestions: buildSummarySuggestions(summary),
    })
  } catch {
    return res.status(502).json({ message: 'The AI service is temporarily unavailable' })
  }
})

router.post('/match-jobs', authenticate, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user }).sort({ updatedAt: -1 })

    if (!resume) {
      return res.status(400).json({ message: 'Please create a resume before using AI job matching.' })
    }

    const jobs = await Job.find().sort({ createdAt: -1 })

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        source: 'skill-based',
        matches: buildSkillMatches(resume, jobs),
      })
    }

    const resumeData = {
      summary: resume.summary || '',
      skills: resume.skills || [],
      education: resume.education || [],
      projects: resume.projects || [],
      experience: resume.experience || [],
    }
    const jobData = jobs.map((job) => ({
      jobId: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      skills: job.skills,
    }))

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      instructions: matchingInstructions,
      input: JSON.stringify({ resume: resumeData, jobs: jobData }),
    })
    const output = response.output_text?.trim()

    if (!output) {
      return res.status(502).json({ message: 'The AI service returned an empty response' })
    }

    return res.json({
      success: true,
      source: 'openai',
      matches: cleanMatches(parseMatches(output), jobs),
    })
  } catch {
    return res.status(502).json({ message: 'The AI job matching service is temporarily unavailable.' })
  }
})

export default router
