import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'
const statuses = ['Applied', 'Reviewing', 'Rejected']

function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [isAdmin, setIsAdmin] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.assign('/login')
        return
      }
      const response = await fetch(`${API_URL}/applications/admin/all`, {
        headers: { Authorization: ['Bearer', token].join(' ') },
      })
      if (response.status === 401) {
        window.location.assign('/login')
        return
      }
      if (response.status === 403) {
        setIsAdmin(false)
        return
      }
      if (!response.ok) {
        setMessage('Unable to load applications.')
        return
      }
      const data = await response.json()
      setApplications(data.applications || [])
      setIsAdmin(true)
    }
    load()
  }, [])

  async function updateStatus(id, status) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/applications/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', token].join(' ') },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.message || 'Unable to update application status.')
      return
    }
    setApplications((current) => current.map((application) => application._id === id ? data.application : application))
    setMessage('Application status updated successfully.')
  }

  return (
    <main className="admin-shell">
      <header className="admin-intro">
        <p className="eyebrow">APPLICATION MANAGEMENT</p>
        <h1>Review and manage job applications.</h1>
      </header>
      {isAdmin === false && <p className="form-message error" role="alert">Admin access required.</p>}
      {isAdmin === true && message && <p className="form-message success" role="status">{message}</p>}
      {isAdmin === true && (
        <section className="admin-application-list" aria-label="All applications">
          {applications.length === 0 && <p className="applications-status">No applications yet.</p>}
          {applications.map((application) => {
            const applicant = application.userId || {}
            const job = application.jobId || {}
            return (
              <article className="admin-application-card builder-card" key={application._id}>
                <div className="admin-job-heading">
                  <div><h2>{applicant.name || 'Applicant'}</h2><p>{applicant.email || 'Email unavailable'}</p></div>
                  <span className="job-location">Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                </div>
                <p className="job-company">{job.title || 'Job unavailable'} · {job.company || 'Company unavailable'}</p>
                <p>{job.location || 'Location unavailable'}</p>
                <label className="status-control"><span>Current status</span><select value={application.status} onChange={(event) => updateStatus(application._id, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default AdminApplications
