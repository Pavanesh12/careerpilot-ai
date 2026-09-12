import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function redirectToLogin() {
  window.location.assign('/login')
}

function JobMatches() {
  const [matches, setMatches] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [jobs, setJobs] = useState([])
  const [isFinding, setIsFinding] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set())
  const [source, setSource] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      redirectToLogin()
      return
    }

    async function loadPageData() {
      const token = localStorage.getItem('token')
      try {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          fetch(`${API_URL}/jobs`),
          fetch(`${API_URL}/applications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (applicationsResponse.status === 401) {
          redirectToLogin()
          return
        }

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          setJobs(jobsData.jobs || [])
        }

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json()
          const jobIds = (applicationsData.applications || [])
            .map((application) => application.jobId?._id || application.jobId)
            .filter(Boolean)
          setAppliedJobIds(new Set(jobIds))
        }
      } catch {
        // Matching can still be requested; missing job details use a safe fallback.
      }
    }

    loadPageData()
  }, [])

  async function findMatches() {
    if (isFinding) return

    const token = localStorage.getItem('token')
    if (!token) {
      redirectToLogin()
      return
    }

    setMessage({ type: '', text: '' })
    setSource('')
    setHasSearched(true)
    setIsFinding(true)

    try {
      const response = await fetch(`${API_URL}/ai/match-jobs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        redirectToLogin()
        return
      }

      if (response.status === 400) {
        setMatches([])
        setMessage({ type: 'no-resume', text: 'Create a resume first to get personalized job matches.' })
        return
      }

      if (!response.ok) {
        throw new Error('match request failed')
      }

      const data = await response.json()
      setSource(data.source || '')
      setMatches(Array.isArray(data.matches) ? data.matches : [])
    } catch (error) {
      console.error('Job matching request failed:', error.message)
      setMatches([])
      setMessage({ type: 'error', text: "We couldn't find your matches right now. Please try again." })
    } finally {
      setIsFinding(false)
    }
  }

  function getJobDetails(jobId) {
    return jobs.find((job) => job._id === jobId) || {}
  }

  return (
    <main className="matches-shell">

      <header className="matches-intro">
        <p className="eyebrow">Personalized discovery</p>
        <h1>AI Job Matches</h1>
        <p>Discover opportunities that match your skills, experience, education, and projects.</p>
        <button type="button" className="primary-button matches-button" onClick={findMatches} disabled={isFinding}>
          {isFinding ? 'Finding Matches...' : 'Find My Matches'}
        </button>
      </header>

      {source === 'skill-based' && (
        <div className="match-source-note" role="status">
          <strong>Smart job matching</strong>
          <p>We compare your resume with job requirements to find roles that fit your skills and highlight what you can learn next.</p>
        </div>
      )}
      {source === 'openai' && <p className="match-source-note" role="status">AI-powered recommendation</p>}
      {message.type === 'error' && (
        <div className="matches-empty" role="alert">
          <p>{message.text}</p>
          <button type="button" className="secondary-button matches-browse-button" onClick={findMatches} disabled={isFinding}>Try Again</button>
        </div>
      )}

      {!isFinding && !hasSearched && !message.text && matches.length === 0 && (
        <div className="matches-empty">
          <p>Find roles selected for your resume by clicking the button above.</p>
        </div>
      )}

      {!isFinding && !message.text && matches.length > 0 && (
        <section className="matches-grid" aria-label="AI job matches">
          {matches.slice(0, 5).map((match) => {
            const job = getJobDetails(match.jobId)
            const isApplied = appliedJobIds.has(match.jobId)

            return (
              <article className="match-card" key={match.jobId}>
                <div className="match-card-heading">
                  <div>
                    <p className="job-company">{match.company || job.company || 'Company unavailable'}</p>
                    <h2>{match.title || job.title || 'Matched job'}</h2>
                  </div>
                  <span className="job-location">{match.location || job.location || 'Location unavailable'}</span>
                </div>
                <div className="match-score">{match.score}% <span>Match</span></div>
                <div className="match-section">
                  <strong>Why this matches</strong>
                  <p className="match-reason">{match.reason}</p>
                </div>
                {match.strengths?.length > 0 && (
                  <div className="match-section">
                    <strong>Your strengths</strong>
                    <div className="job-skills">{match.strengths.map((skill) => <span className="job-skill" key={skill}>{skill}</span>)}</div>
                  </div>
                )}
                <div className="match-section">
                  <strong>Skills you need to learn</strong>
                  {match.missingSkills?.length ? (
                    <div className="job-skills">
                      {match.missingSkills.map((skill) => <span className="job-skill missing-skill" key={skill}>{skill}</span>)}
                    </div>
                  ) : (
                    <p className="match-note">Great! You have the key skills for this role.</p>
                  )}
                </div>
                {match.skillGaps?.length > 0 && (
                  <div className="match-section">
                    <strong>Skill gap analysis</strong>
                    {match.skillGaps.map((gap) => (
                      <div className="match-gap" key={gap.skill}>
                        <strong>{gap.skill}</strong>
                        <span>Priority: {gap.priority}</span>
                        <p>{gap.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                {match.learningRecommendations?.length > 0 && (
                  <div className="match-section">
                    <strong>Learning recommendation</strong>
                    {match.learningRecommendations.map((recommendation) => (
                      <div className="match-gap" key={`learn-${recommendation.skill}`}>
                        <strong>{recommendation.skill}</strong>
                        <p>{recommendation.learningRecommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="match-recommendation"><strong>Recommendation:</strong> {match.recommendation}</p>
                <button type="button" className="primary-button job-apply-button match-apply-button" onClick={() => { window.location.href = `/jobs/${match.jobId}/apply` }} disabled={isApplied}>
                  {isApplied ? 'Applied' : 'Apply Now'}
                </button>
              </article>
            )
          })}
        </section>
      )}

      {!isFinding && hasSearched && !message.text && matches.length === 0 && jobs.length === 0 && (
        <div className="matches-empty">
          <p>No job matches are available yet.</p>
          <a className="secondary-button matches-browse-button" href="/jobs">Browse Jobs</a>
        </div>
      )}
      {!isFinding && hasSearched && !message.text && matches.length === 0 && jobs.length > 0 && (
        <div className="matches-empty">
          <p>No matching jobs found.</p>
          <a className="secondary-button matches-browse-button" href="/jobs">Browse Jobs</a>
        </div>
      )}
      {!isFinding && !hasSearched && !message.text && matches.length === 0 && (
        <a className="secondary-button matches-browse-button" href="/jobs">Browse Jobs</a>
      )}
      {message.type === 'no-resume' && (
        <div className="matches-empty">
          <p>{message.text}</p>
          <a className="secondary-button matches-browse-button" href="/resume-builder/new">Create Resume</a>
        </div>
      )}
    </main>
  )
}

export default JobMatches
