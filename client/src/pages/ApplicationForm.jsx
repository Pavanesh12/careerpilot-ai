import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function ApplicationForm({ jobId }) {
  const [job, setJob] = useState(null)
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ applicantName: '', applicantEmail: '', phone: '', location: '', experienceLevel: 'Fresher', workPreference: 'Any', coverNote: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.assign('/login')
      return
    }
    Promise.all([
      fetch(`${API_URL}/jobs/${jobId}`).then((response) => response.json()),
      fetch(`${API_URL}/resumes`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.json()),
    ]).then(([jobData, resumeData]) => {
      setJob(jobData.job)
      setResumes(resumeData.resumes || [])
      const resume = resumeData.resumes?.[0]
      if (resume) {
        setSelectedResume(resume._id)
        setForm((current) => ({ ...current, applicantName: resume.personalInfo?.fullName || '', applicantEmail: resume.personalInfo?.email || '', phone: resume.personalInfo?.phone || '', location: resume.personalInfo?.location || '' }))
      }
    }).catch(() => setMessage({ type: 'error', text: 'Something went wrong. Please try again.' }))
  }, [jobId])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseResume(event) {
    const resume = resumes.find((item) => item._id === event.target.value)
    setSelectedResume(event.target.value)
    if (resume) setForm((current) => ({ ...current, applicantName: resume.personalInfo?.fullName || '', applicantEmail: resume.personalInfo?.email || '', phone: resume.personalInfo?.phone || '', location: resume.personalInfo?.location || '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!selectedResume && !file) {
      setMessage({ type: 'error', text: 'Please upload or select your resume before applying.' })
      return
    }
    if (!form.applicantName.trim() || !form.applicantEmail.trim() || !form.phone.trim() || !form.location.trim()) {
      setMessage({ type: 'error', text: 'Please complete your name, email, phone, and location.' })
      return
    }
    setIsSubmitting(true); setMessage({ type: '', text: '' })
    const body = new FormData()
    body.append('jobId', jobId)
    if (selectedResume) body.append('resumeId', selectedResume)
    if (file) body.append('resumeFile', file)
    Object.entries(form).forEach(([key, value]) => body.append(key, value))
    try {
      const response = await fetch(`${API_URL}/applications`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body })
      const data = await response.json()
      if (response.status === 401) { window.location.assign('/login'); return }
      if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.')
      setSubmitted(true)
    } catch (error) {
      setMessage({ type: 'error', text: error.message.includes('PDF') ? error.message : 'Something went wrong. Please try again.' })
    } finally { setIsSubmitting(false) }
  }

  if (!job) return <main className="applications-shell"><p className="applications-status">Loading application...</p></main>
  if (submitted) return <main className="applications-shell"><section className="application-success builder-card"><h1>✓ Application submitted successfully</h1><p>You have successfully applied for {job.title}.</p><p>Your application is now under review.</p><a className="primary-button" href="/applications">View My Applications</a></section></main>

  return (
    <main className="applications-shell">
      <header className="applications-intro"><p className="eyebrow">Job application</p><h1>Apply for {job.title}</h1><p>Complete your application before submitting.</p></header>
      <form className="application-form builder-card" onSubmit={submit}>
        <h2>Your Resume</h2><p>Choose an existing resume or upload a PDF, DOC, or DOCX file. Maximum file size: 5 MB.</p>
        <label className="form-field"><span>Select Existing Resume</span><select value={selectedResume} onChange={chooseResume}><option value="">Choose a resume</option>{resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title || 'My Resume'}</option>)}</select></label>
        <label className="form-field"><span>Upload Resume</span><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
        <h2>Applicant Details</h2>
        <div className="form-grid">{[['applicantName', 'Full Name'], ['applicantEmail', 'Email'], ['phone', 'Phone'], ['location', 'Location']].map(([name, label]) => <label className="form-field" key={name}><span>{label}</span><input name={name} value={form[name]} onChange={updateField} required /></label>)}</div>
        <div className="form-grid"><label className="form-field"><span>Experience Level</span><select name="experienceLevel" value={form.experienceLevel} onChange={updateField}>{['Fresher', '0-1 years', '1-3 years', '3+ years'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="form-field"><span>Preferred Work Location</span><select name="workPreference" value={form.workPreference} onChange={updateField}>{['On-site', 'Hybrid', 'Remote', 'Any'].map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <label className="form-field"><span>Cover Note (optional)</span><textarea name="coverNote" value={form.coverNote} onChange={updateField} placeholder="Tell the employer briefly why you are interested in this role." rows="5" /></label>
        {message.text && <p className="form-message error" role="alert">{message.text}</p>}<button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting application...' : 'Submit Application'}</button>
      </form>
    </main>
  )
}

export default ApplicationForm
