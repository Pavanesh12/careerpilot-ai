import { useEffect, useMemo, useState } from 'react'
import API_URL from '../config/api.js'

function formatPostedDate(date) {
  if (!date) {
    return 'Recently posted'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set())

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch(`${API_URL}/jobs`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load jobs.')
        }

        setJobs(data.jobs || [])
      } catch (loadError) {
        setError(loadError.message || 'Unable to load jobs.')
      } finally {
        setIsLoading(false)
      }
    }

    loadJobs()
  }, [])

  useEffect(() => {
    async function loadApplications() {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      try {
        const response = await fetch(`${API_URL}/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.status === 401) {
          window.location.assign('/login')
          return
        }

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const jobIds = (data.applications || [])
          .map((application) => application.jobId?._id || application.jobId)
          .filter(Boolean)

        setAppliedJobIds(new Set(jobIds))
      } catch {
        // Job browsing remains available if application history cannot load.
      }
    }

    loadApplications()
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return jobs
    }

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company,
        ...(Array.isArray(job.skills) ? job.skills : []),
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [jobs, search])

  return (
    <main className="jobs-shell">

      <header className="jobs-intro">
        <p className="eyebrow">Explore opportunities</p>
        <h1>Find your next opportunity</h1>
        <p>Discover jobs that match your skills and career goals.</p>
      </header>

      <section className="jobs-toolbar" aria-label="Job search">
        <label className="jobs-search">
          <span>Search jobs</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs by title, company, or skill"
          />
        </label>
        {!isLoading && !error && <span className="jobs-count">{filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'}</span>}
      </section>

      {isLoading && <p className="jobs-status">Loading jobs...</p>}
      {!isLoading && error && <p className="jobs-status error-text" role="alert">{error}</p>}
      {!isLoading && !error && filteredJobs.length === 0 && (
        <p className="jobs-status">{jobs.length === 0 ? 'No jobs available yet.' : 'No jobs match your search.'}</p>
      )}

      {!isLoading && !error && filteredJobs.length > 0 && (
        <section className="jobs-grid" aria-label="Available jobs">
          {filteredJobs.map((job) => (
            <article className="job-card" key={job._id}>
              <div className="job-card-heading">
                <div>
                  <p className="job-company">{job.company}</p>
                  <h2>{job.title}</h2>
                </div>
                <span className="job-location">{job.location}</span>
              </div>
              <p className="job-description">{job.description}</p>
              <div className="job-skills">
                {(job.skills || []).map((skill) => <span className="job-skill" key={skill}>{skill}</span>)}
              </div>
              <div className="job-card-footer">
                <span className="job-date">Posted {formatPostedDate(job.createdAt)}</span>
                <button
                  type="button"
                  className="primary-button job-apply-button"
                  onClick={() => { window.location.href = `/jobs/${job._id}/apply` }}
                  disabled={appliedJobIds.has(job._id)}
                >
                  {appliedJobIds.has(job._id) ? 'Applied' : 'Apply Now'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default Jobs
