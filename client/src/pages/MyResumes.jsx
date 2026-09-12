import { useEffect, useMemo, useState } from 'react'
import API_URL from '../config/api.js'

function MyResumes() {
  const [resumes, setResumes] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.assign('/login')
      return
    }

    fetch(`${API_URL}/resumes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign('/login')
          return null
        }
        if (!response.ok) throw new Error('load failed')
        return response.json()
      })
      .then((data) => {
        if (data) setResumes(data.resumes || [])
      })
      .catch(() => setMessage('Unable to load your resumes. Please try again.'))
  }, [])

  const filteredResumes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return resumes
    return resumes.filter((resume) => (
      (resume.title || 'My Resume').toLowerCase().includes(query)
      || (resume.summary || '').toLowerCase().includes(query)
    ))
  }, [resumes, search])

  async function deleteResume(resume) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/resumes/${resume._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 401) {
      window.location.assign('/login')
      return
    }
    if (!response.ok) {
      setMessage('Unable to delete this resume. Please try again.')
      return
    }
    setResumes((current) => current.filter((item) => item._id !== resume._id))
    setPendingDelete(null)
  }

  return (
    <main className="builder-shell">
      <header className="builder-intro">
        <p className="eyebrow">Your Resume Workspace</p>
        <h1>My Resumes</h1>
        <p>Keep tailored resumes ready for every opportunity.</p>
      </header>
      <section className="resume-library builder-card">
        <div className="resume-library-toolbar">
          <input
            className="resume-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resumes..."
            aria-label="Search resumes"
          />
          <a className="primary-button" href="/resume-builder/new">+ Create New Resume</a>
        </div>
        {message && <p className="form-message error" role="alert">{message}</p>}
        {resumes.length === 0 ? (
          <div className="resume-library-empty">
            <p>You haven't created a resume yet.</p>
            <span>Create your first resume to get started.</span>
            <a className="secondary-button" href="/resume-builder/new">Create New Resume</a>
          </div>
        ) : filteredResumes.length === 0 ? (
          <p className="resume-library-empty">No resumes found.</p>
        ) : (
          <div className="resume-library-grid">
            {filteredResumes.map((resume) => (
              <article className="resume-library-card" key={resume._id}>
                <h3>{resume.title || 'My Resume'}</h3>
                <p className="resume-updated">Last updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                <p className="resume-summary-preview">{resume.summary ? `${resume.summary.slice(0, 120)}${resume.summary.length > 120 ? '…' : ''}` : 'No summary added yet.'}</p>
                <div className="resume-card-actions">
                  <a className="secondary-button" href={`/resume-builder/${resume._id}`}>Edit</a>
                  <a className="secondary-button" href={`/resume-preview/${resume._id}`}>Preview</a>
                  <button type="button" className="text-button danger" onClick={() => setPendingDelete(resume)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {pendingDelete && (
        <div className="delete-dialog-backdrop" role="presentation">
          <section className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-resume-title">
            <h2 id="delete-resume-title">Are you sure you want to delete this resume?</h2>
            <p>{pendingDelete.title || 'My Resume'}</p>
            <div className="resume-card-actions">
              <button type="button" className="clear-button" onClick={() => setPendingDelete(null)}>Cancel</button>
              <button type="button" className="primary-button danger-button" onClick={() => deleteResume(pendingDelete)}>Delete Resume</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default MyResumes
