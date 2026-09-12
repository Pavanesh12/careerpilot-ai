import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.assign('/login')
        return
      }

      try {
        const headers = { Authorization: ['Bearer', token].join(' ') }
        const [userResponse, jobsResponse, applicationsResponse] = await Promise.all([
          fetch(`${API_URL}/auth/me`, { headers }),
          fetch(`${API_URL}/jobs`),
          fetch(`${API_URL}/applications/admin/all`, { headers }),
        ])

        if (userResponse.status === 401 || applicationsResponse.status === 401) {
          window.location.assign('/login')
          return
        }

        if (userResponse.status === 403 || applicationsResponse.status === 403) {
          setError('Access denied. This dashboard is available to administrators only.')
          return
        }

        if (!userResponse.ok || !jobsResponse.ok || !applicationsResponse.ok) {
          setError('Unable to load the admin dashboard. Please try again.')
          return
        }

        const userData = await userResponse.json()
        const jobsData = await jobsResponse.json()
        const applicationsData = await applicationsResponse.json()

        if (userData.user?.role !== 'admin') {
          setError('Access denied. This dashboard is available to administrators only.')
          return
        }

        setUser(userData.user)
        setJobs(jobsData.jobs || [])
        setApplications(applicationsData.applications || [])
      } catch {
        setError('Unable to load the admin dashboard. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const statusCounts = applications.reduce((counts, application) => {
    if (Object.prototype.hasOwnProperty.call(counts, application.status)) {
      counts[application.status] += 1
    }
    return counts
  }, { Applied: 0, Reviewing: 0, Rejected: 0 })

  if (isLoading) {
    return <main className="admin-dashboard-shell"><p className="applications-status">Loading dashboard...</p></main>
  }

  if (error) {
    return (
      <main className="admin-dashboard-shell">
        <section className="admin-access-card builder-card">
          <p className="eyebrow">CareerPilot AI</p>
          <h1>Access Denied</h1>
          <p>{error}</p>
          <a className="primary-button" href="/">Back to CareerPilot AI</a>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-dashboard-shell">
      <section className="admin-dashboard-main">
        <header className="admin-dashboard-topbar">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Welcome, Admin</h1>
          </div>
          <div className="admin-profile-compact">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </header>
        <p className="admin-dashboard-subtitle">Manage jobs and applications from your CareerPilot AI dashboard.</p>

        <section className="admin-stats-grid" aria-label="Dashboard statistics">
          {[
            ['Total Jobs', jobs.length, 'admin-stat-primary'],
            ['Total Applications', applications.length, ''],
            ['Applied', statusCounts.Applied, ''],
            ['Reviewing', statusCounts.Reviewing, ''],
            ['Rejected', statusCounts.Rejected, ''],
          ].map(([label, value, className]) => (
            <article className={`admin-stat-card ${className}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="admin-dashboard-grid">
          <article className="admin-dashboard-panel builder-card">
            <div className="admin-panel-heading">
              <div><p className="eyebrow">Recent activity</p><h2>Recent Applications</h2></div>
              <a className="secondary-button" href="/admin/applications">View All Applications</a>
            </div>
            {applications.length === 0 ? <p className="applications-status">No applications yet.</p> : (
              <div className="admin-recent-list">
                {applications.slice(0, 5).map((application) => (
                  <div className="admin-recent-item" key={application._id}>
                    <div>
                      <strong>{application.applicantName || application.userId?.name || 'Applicant'}</strong>
                      <span>{application.jobId?.title || 'Job unavailable'} · {application.jobId?.company || 'Company unavailable'}</span>
                    </div>
                    <div className="admin-recent-meta">
                      <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                      <b className={`status-badge status-${String(application.status || '').toLowerCase()}`}>{application.status}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="admin-dashboard-panel builder-card">
            <div className="admin-panel-heading"><div><p className="eyebrow">Job management</p><h2>Manage Jobs</h2></div></div>
            <p>{jobs.length} {jobs.length === 1 ? 'job is' : 'jobs are'} currently published.</p>
            <div className="admin-dashboard-actions">
              <a className="primary-button" href="/admin/jobs">Manage Jobs</a>
              <a className="secondary-button" href="/admin/jobs">+ Add New Job</a>
            </div>
          </article>

          <article className="admin-dashboard-panel admin-dashboard-application-panel builder-card">
            <div className="admin-panel-heading"><div><p className="eyebrow">Application management</p><h2>Applications</h2></div></div>
            <p>{statusCounts.Applied} applications are awaiting review.</p>
            <a className="primary-button" href="/admin/applications">View Applications</a>
          </article>

          <article className="admin-dashboard-panel builder-card">
            <div className="admin-panel-heading"><div><p className="eyebrow">Admin profile</p><h2>Your Profile</h2></div></div>
            <div className="admin-profile-details"><strong>{user?.name}</strong><span>{user?.email}</span></div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default AdminDashboard
