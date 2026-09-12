import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function redirectToLogin() {
  window.location.assign('/login')
}

function formatAppliedDate(date) {
  if (!date) return 'Recently applied'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date))
}

function statusMeaning(status) {
  return {
    Applied: 'The application has been submitted.',
    Reviewing: 'The employer/admin is reviewing the application.',
    Rejected: 'The application was not selected for the role.',
  }[status] || ''
}

function Applications() {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    async function loadApplications() {
      const token = localStorage.getItem('token')
      if (!token) {
        redirectToLogin()
        return
      }
      try {
        const response = await fetch(`${API_URL}/applications`, {
          headers: { Authorization: ['Bearer', token].join(' ') },
        })
        if (response.status === 401) {
          redirectToLogin()
          return
        }
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load applications.')
        setApplications(data.applications || [])
      } catch (loadError) {
        setError(loadError.message || 'Unable to load applications.')
      } finally {
        setIsLoading(false)
      }
    }
    loadApplications()
  }, [])

  async function deleteApplication(applicationId) {
    if (!window.confirm('Remove this application from your tracker?')) return
    const token = localStorage.getItem('token')
    if (!token) {
      redirectToLogin()
      return
    }
    setActionError('')
    try {
      const response = await fetch(`${API_URL}/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { Authorization: ['Bearer', token].join(' ') },
      })
      if (response.status === 401) {
        redirectToLogin()
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to delete application.')
      setApplications((current) => current.filter((application) => application._id !== applicationId))
    } catch (deleteError) {
      setActionError(deleteError.message || 'Unable to delete application.')
    }
  }

  return (
    <main className="applications-shell">
      <header className="applications-intro">
        <p className="eyebrow">Your progress</p>
        <h1>Track every opportunity.</h1>
        <p>Keep your applications organized and up to date in one place.</p>
      </header>
      {isLoading && <p className="applications-status">Loading applications...</p>}
      {!isLoading && error && <p className="applications-status error-text" role="alert">{error}</p>}
      {!isLoading && !error && actionError && <p className="form-message error" role="alert">{actionError}</p>}
      {!isLoading && !error && applications.length === 0 && (
        <div className="applications-empty"><p>No applications yet.</p><a className="primary-button" href="/jobs">Browse Jobs</a></div>
      )}
      {!isLoading && !error && applications.length > 0 && (
        <section className="applications-grid" aria-label="Your applications">
          {applications.map((application) => {
            const job = application.jobId || {}
            return (
              <article className="application-card" key={application._id}>
                <div className="application-card-heading">
                  <div><p className="job-company">{job.company || 'Company unavailable'}</p><h2>{job.title || 'Job unavailable'}</h2></div>
                  <span className="job-location">{job.location || 'Location unavailable'}</span>
                </div>
                <div className="application-details">
                  <span>Applied {formatAppliedDate(application.appliedAt)}</span>
                  <span>Application Status</span>
                  <span className={`status-badge status-${application.status.toLowerCase()}`}>{application.status}</span>
                  <span>{statusMeaning(application.status)}</span>
                </div>
                <div className="application-actions">
                  <button type="button" className="text-button danger" onClick={() => deleteApplication(application._id)}>Delete</button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default Applications
