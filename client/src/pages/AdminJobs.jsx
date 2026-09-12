import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'
const emptyForm = {
  title: '',
  company: '',
  location: '',
  description: '',
  skills: '',
}

function redirectToLogin() {
  window.location.assign('/login')
}

function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAdminPage() {
      const token = localStorage.getItem('token')
      if (!token) {
        redirectToLogin()
        return
      }

      try {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (userResponse.status === 401) {
          redirectToLogin()
          return
        }

        const userData = await userResponse.json()
        if (userData.user?.role !== 'admin') {
          setIsAdmin(false)
          return
        }

        setIsAdmin(true)
        await loadJobs()
      } catch {
        setError('Unable to load admin job management.')
        setIsAdmin(false)
      }
    }

    async function loadJobs() {
      const response = await fetch(`${API_URL}/jobs`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error('Unable to load jobs.')
      }
      setJobs(data.jobs || [])
    }

    loadAdminPage()
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function startEdit(job) {
    setEditingId(job._id)
    setIsFormOpen(true)
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      skills: (job.skills || []).join(', '),
    })
    setMessage({ type: '', text: '' })
  }

  function resetForm() {
    setEditingId('')
    setForm(emptyForm)
    setIsFormOpen(false)
  }

  function openCreateForm() {
    setEditingId('')
    setForm(emptyForm)
    setIsFormOpen(true)
    setMessage({ type: '', text: '' })
  }

  async function saveJob(event) {
    event.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) {
      redirectToLogin()
      return
    }

    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    }

    try {
      const response = await fetch(`${API_URL}/jobs${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (response.status === 401) {
        redirectToLogin()
        return
      }
      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Admin access required.' })
        return
      }
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save job.')
      }

      setMessage({ type: 'success', text: editingId ? 'Job updated successfully.' : 'Job created successfully.' })
      resetForm()
      await refreshJobs()
    } catch {
      setMessage({ type: 'error', text: 'Unable to save job. Please check the form and try again.' })
    }
  }

  async function refreshJobs() {
    const response = await fetch(`${API_URL}/jobs`)
    const data = await response.json()
    if (response.ok) {
      setJobs(data.jobs || [])
    }
  }

  async function deleteJob(jobId) {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return
    }

    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        redirectToLogin()
        return
      }
      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Admin access required.' })
        return
      }
      if (!response.ok) {
        throw new Error('Unable to delete job.')
      }

      setJobs((current) => current.filter((job) => job._id !== jobId))
      setMessage({ type: 'success', text: 'Job deleted successfully.' })
    } catch {
      setMessage({ type: 'error', text: 'Unable to delete job. Please try again.' })
    }
  }

  return (
    <main className="admin-shell">

      <header className="admin-intro">
        <p className="eyebrow">Administration</p>
        <h1>Job Management</h1>
        <p>Create, update, and remove opportunities from the platform.</p>
      </header>

      {isAdmin === false && <p className="form-message error" role="alert">{error || 'Admin access required.'}</p>}
      {isAdmin === true && (
        <>
          {message.text && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
          <button type="button" className="primary-button admin-add-button" onClick={editingId ? resetForm : openCreateForm}>
            {editingId ? 'Cancel Edit' : 'Add New Job'}
          </button>
          {isFormOpen && (
            <form className="admin-job-form builder-card" onSubmit={saveJob}>
              <h2>{editingId ? 'Edit Job' : 'Add New Job'}</h2>
              <div className="form-grid">
                {['title', 'company', 'location'].map((field) => (
                  <label className="form-field" key={field}>
                    <span>{field[0].toUpperCase() + field.slice(1)}</span>
                    <input name={field} value={form[field]} onChange={updateField} required />
                  </label>
                ))}
                <label className="form-field"><span>Skills</span><input name="skills" value={form.skills} onChange={updateField} placeholder="React, Node.js, MongoDB" required /></label>
              </div>
              <label className="form-field"><span>Description</span><textarea name="description" value={form.description} onChange={updateField} rows="4" required /></label>
              <div className="form-actions"><button type="button" className="clear-button" onClick={resetForm}>Cancel</button><button type="submit" className="primary-button">{editingId ? 'Update Job' : 'Create Job'}</button></div>
            </form>
          )}
          <section className="admin-job-list" aria-label="All jobs">
            {jobs.map((job) => (
              <article className="admin-job-card" key={job._id}>
                <div className="admin-job-heading"><div><p className="job-company">{job.company}</p><h2>{job.title}</h2></div><span className="job-location">{job.location}</span></div>
                <p>{job.description}</p>
                <div className="job-skills">{(job.skills || []).map((skill) => <span className="job-skill" key={skill}>{skill}</span>)}</div>
                <div className="admin-job-actions"><button type="button" className="secondary-button" onClick={() => startEdit(job)}>Edit</button><button type="button" className="text-button danger" onClick={() => deleteJob(job._id)}>Delete</button></div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}

export default AdminJobs
