import { useEffect, useState } from 'react'
import API_URL from './config/api.js'
import { normalizeExternalUrl } from './config/urls.js'

const emptyEducation = {
  degree: '',
  institution: '',
  startYear: '',
  endYear: '',
  description: '',
}

const emptyProject = {
  title: '',
  description: '',
  technologies: [],
  link: '',
}

const emptyExperience = {
  jobTitle: '',
  company: '',
  startDate: '',
  endDate: '',
  description: '',
}

const initialForm = {
  title: 'My Resume',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
  },
  summary: '',
  education: [],
  skills: [],
  projects: [],
  experience: [],
}

function normalizeResume(resume = {}) {
  return {
    ...initialForm,
    ...resume,
    title: resume.title || 'My Resume',
    personalInfo: { ...initialForm.personalInfo, ...(resume.personalInfo || {}) },
    education: resume.education || [],
    skills: resume.skills || [],
    projects: resume.projects || [],
    experience: resume.experience || [],
  }
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  )
}

function SectionHeader({ number, title, description }) {
  return (
    <div className="builder-section-header">
      <span className="feature-number">{number}</span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  )
}

function hasValue(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function ResumePreview({ form, onBack, onPrint }) {
  const { title, personalInfo, education, projects, experience, skills, summary } = form
  const populatedEducation = education.filter((item) => Object.values(item).some(hasValue))
  const populatedProjects = projects.filter((item) => (
    Object.entries(item).some(([key, value]) => key === 'technologies' ? value.length > 0 : hasValue(value))
  ))
  const populatedExperience = experience.filter((item) => Object.values(item).some(hasValue))

  return (
    <section className="resume-preview-area">
      <div className="preview-actions print-hidden">
        <button type="button" className="clear-button" onClick={onBack}>Back to Editor</button>
        <button type="button" className="primary-button" onClick={onPrint}>Download / Print Resume</button>
      </div>
      <article className="resume-preview">
        <header className="resume-preview-header">
          <p className="resume-preview-title">{title || 'My Resume'}</p>
          <h1>{personalInfo.fullName}</h1>
          <div className="resume-contact">
            {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(hasValue).map((item) => <span key={item}>{item}</span>)}
            {hasValue(personalInfo.linkedin) && <a href={personalInfo.linkedin}>LinkedIn</a>}
            {hasValue(personalInfo.github) && <a href={personalInfo.github}>GitHub</a>}
          </div>
        </header>

        {hasValue(summary) && <section className="resume-preview-section"><h2>Professional Summary</h2><p>{summary}</p></section>}
        {skills.some(hasValue) && <section className="resume-preview-section"><h2>Skills</h2><div className="resume-preview-skills">{skills.filter(hasValue).map((skill) => <span key={skill}>{skill}</span>)}</div></section>}
        {populatedExperience.length > 0 && <section className="resume-preview-section"><h2>Experience</h2>{populatedExperience.map((item, index) => <div className="resume-preview-entry" key={`preview-experience-${index}`}><div className="resume-entry-heading"><div><h3>{item.jobTitle}</h3><p>{item.company}</p></div><span>{[item.startDate, item.endDate].filter(hasValue).join(' – ')}</span></div>{hasValue(item.description) && <p>{item.description}</p>}</div>)}</section>}
        {populatedProjects.length > 0 && <section className="resume-preview-section"><h2>Projects</h2>{populatedProjects.map((item, index) => {
          const projectUrl = normalizeExternalUrl(item.link)
          return <div className="resume-preview-entry" key={`preview-project-${index}`}><div className="resume-entry-heading"><h3>{item.title}</h3>{projectUrl && <a href={projectUrl} target="_blank" rel="noopener noreferrer">View project</a>}</div>{hasValue(item.description) && <p>{item.description}</p>}{item.technologies.length > 0 && <p><strong>Technologies:</strong> {item.technologies.join(', ')}</p>}</div>
        })}</section>}
        {populatedEducation.length > 0 && <section className="resume-preview-section"><h2>Education</h2>{populatedEducation.map((item, index) => <div className="resume-preview-entry" key={`preview-education-${index}`}><div className="resume-entry-heading"><div><h3>{item.degree}</h3><p>{item.institution}</p></div><span>{[item.startYear, item.endYear].filter(hasValue).join(' – ')}</span></div>{hasValue(item.description) && <p>{item.description}</p>}</div>)}</section>}
      </article>
    </section>
  )
}

function ResumeBuilder({ mode = 'new', resumeId = '' }) {
  const [form, setForm] = useState(initialForm)
  const [skillInput, setSkillInput] = useState('')
  const [projectTechnologyInputs, setProjectTechnologyInputs] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [summaryMessage, setSummaryMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(mode === 'preview')
  const [hasSavedResume, setHasSavedResume] = useState(mode !== 'new')
  const [summaryAlternatives, setSummaryAlternatives] = useState([])
  const [summarySource, setSummarySource] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    async function loadSavedResume() {
      if (mode === 'new') {
        setForm(normalizeResume())
        setIsPreviewing(false)
        setHasSavedResume(false)
        return
      }
      setForm(normalizeResume())
      const response = await fetch(`${API_URL}/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!response.ok) return
      const data = await response.json()
      if (data.resume) setForm(normalizeResume(data.resume))
    }

    loadSavedResume()
  }, [mode, resumeId])

  function updatePersonalInfo(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      personalInfo: { ...current.personalInfo, [name]: value },
    }))
  }

  function updateSection(section, index, event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    }))
  }

  function addSkill(event) {
    event.preventDefault()
    const skill = skillInput.trim()

    if (skill && !form.skills.includes(skill)) {
      setForm((current) => ({ ...current, skills: [...current.skills, skill] }))
    }

    setSkillInput('')
  }

  function removeSkill(skillToRemove) {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  function addProjectTechnology(event, index) {
    event.preventDefault()
    const technology = (projectTechnologyInputs[index] || '').trim()

    if (technology) {
      setForm((current) => ({
        ...current,
        projects: current.projects.map((project, projectIndex) =>
          projectIndex === index && !project.technologies.includes(technology)
            ? { ...project, technologies: [...project.technologies, technology] }
            : project,
        ),
      }))
    }

    setProjectTechnologyInputs((current) => ({ ...current, [index]: '' }))
  }

  function removeItem(section, index) {
    setForm((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function clearForm() {
    setForm(normalizeResume())
    setSkillInput('')
    setProjectTechnologyInputs({})
    setMessage({ type: '', text: '' })
    setSummaryMessage({ type: '', text: '' })
    setSummaryAlternatives([])
    setSummarySource('')
    setHasSavedResume(false)
  }

  async function improveSummary() {
    setSummaryMessage({ type: '', text: '' })
    setSummaryAlternatives([])
    setSummarySource('')

    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    if (!form.summary.trim()) {
      setSummaryMessage({ type: 'error', text: 'Enter a summary before improving it.' })
      return
    }

    setIsImproving(true)

    try {
      const response = await fetch(`${API_URL}/ai/improve-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ summary: form.summary, resume: form }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error('Unable to improve your summary right now. Please try again.')
      }

      setForm((current) => ({ ...current, summary: data.improvedSummary }))
      setSummarySource(data.source || '')
      setSummaryAlternatives(Array.isArray(data.alternatives) ? data.alternatives : [])
      setSummaryMessage({ type: 'success', text: 'Your professional summary was improved.' })
    } catch {
      setSummaryMessage({ type: 'error', text: 'Unable to improve your summary right now. Please try again.' })
    } finally {
      setIsImproving(false)
    }
  }

  async function saveResume(event) {
    event.preventDefault()
    setMessage({ type: '', text: '' })

    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    if (!form.personalInfo.fullName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your full name.' })
      return
    }

    if (!form.personalInfo.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalInfo.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`${API_URL}/resumes${mode === 'edit' ? `/${resumeId}` : ''}`, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save your resume.')
      }

      setMessage({ type: 'success', text: 'Your resume was saved successfully.' })
      setHasSavedResume(true)
      window.location.href = '/my-resumes'
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to save your resume.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isPreviewing) {
    if (!hasSavedResume) {
      return (
        <main className="builder-shell">
          <p className="form-message error">Save your resume first to preview it.</p>
          <button type="button" className="clear-button" onClick={() => setIsPreviewing(false)}>Back to Editor</button>
        </main>
      )
    }
    return <main className="builder-shell"><ResumePreview form={form} onBack={() => { window.location.href = `/resume-builder/${resumeId}` }} onPrint={() => window.print()} /></main>
  }

  return (
    <main className="builder-shell">

      <header className="builder-intro">
        <p className="eyebrow">{mode === 'edit' ? 'EDIT RESUME' : 'CREATE RESUME'}</p>
        <h1>{mode === 'edit' ? 'Update your resume and keep it ready for your next opportunity.' : 'Build a resume that opens doors.'}</h1>
        <p>Build a professional resume and improve it with AI.</p>
        {mode === 'edit' && <a className="clear-button" href="/my-resumes">My Resumes</a>}
        {mode === 'edit' && <button type="button" className="primary-button preview-button" onClick={() => { window.location.href = `/resume-preview/${resumeId}` }}>Preview Resume</button>}
      </header>

      <form className="resume-form" onSubmit={saveResume}>
        <section className="builder-card">
          <SectionHeader number="00" title="Resume Details" description="Give this resume a name so you can find it easily later." />
          <Field
            label="Resume Title"
            name="title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="e.g. Frontend Developer Resume"
          />
        </section>
        <section className="builder-card">
          <SectionHeader number="01" title="Personal Information" description="Start with the details employers use to reach you." />
          <div className="form-grid">
            <Field label="Full Name" name="fullName" value={form.personalInfo.fullName} onChange={updatePersonalInfo} placeholder="e.g. Alex Johnson" />
            <Field label="Email" name="email" type="email" value={form.personalInfo.email} onChange={updatePersonalInfo} placeholder="alex@example.com" />
            <Field label="Phone" name="phone" type="tel" value={form.personalInfo.phone} onChange={updatePersonalInfo} placeholder="+1 555 123 4567" />
            <Field label="Location" name="location" value={form.personalInfo.location} onChange={updatePersonalInfo} placeholder="City, Country" />
            <Field label="LinkedIn" name="linkedin" type="url" value={form.personalInfo.linkedin} onChange={updatePersonalInfo} placeholder="https://linkedin.com/in/your-name" />
            <Field label="GitHub" name="github" type="url" value={form.personalInfo.github} onChange={updatePersonalInfo} placeholder="https://github.com/your-name" />
          </div>
        </section>

        <section className="builder-card">
          <SectionHeader number="02" title="Professional Summary" description="A short introduction that highlights your strengths." />
          <label className="form-field">
            <span>Summary</span>
            <textarea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Write 2–4 sentences about your experience, strengths, and goals." rows="6" />
          </label>
          <div className="summary-actions">
            <button type="button" className="secondary-button ai-button" onClick={improveSummary} disabled={isImproving}>
              {isImproving ? 'Improving your professional summary...' : 'Improve with AI'}
            </button>
          </div>
          {summarySource && (
            <p className="summary-source-label" role="status">
              {summarySource === 'openai' ? '✨ AI-powered improvement' : '✨ Smart resume improvement'}
            </p>
          )}
          {summaryMessage.text && <div className={`form-message ${summaryMessage.type}`} role="status">{summaryMessage.text}</div>}
          {summaryAlternatives.length > 0 && (
            <div className="summary-alternatives">
              <h3>✨ Alternative Resume Summaries</h3>
              <div className="summary-alternative-grid">
                {summaryAlternatives.map((alternative) => (
                  <article className="summary-alternative-card" key={alternative.title}>
                    <h4>{alternative.title}</h4>
                    <p>{alternative.summary}</p>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setForm((current) => ({ ...current, summary: alternative.summary }))}
                    >
                      Use this summary
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="builder-card">
          <SectionHeader number="03" title="Education" description="Add your academic background." />
          {form.education.map((education, index) => (
            <div className="repeatable-card" key={`education-${index}`}>
              <div className="repeatable-heading"><h3>Education {index + 1}</h3><button type="button" className="text-button danger" onClick={() => removeItem('education', index)}>Remove</button></div>
              <div className="form-grid">
                <Field label="Degree" name="degree" value={education.degree} onChange={(event) => updateSection('education', index, event)} placeholder="e.g. B.Sc. Computer Science" />
                <Field label="Institution" name="institution" value={education.institution} onChange={(event) => updateSection('education', index, event)} placeholder="University or college" />
                <Field label="Start Year" name="startYear" value={education.startYear} onChange={(event) => updateSection('education', index, event)} placeholder="2020" />
                <Field label="End Year" name="endYear" value={education.endYear} onChange={(event) => updateSection('education', index, event)} placeholder="2024" />
              </div>
              <label className="form-field"><span>Description</span><textarea name="description" value={education.description} onChange={(event) => updateSection('education', index, event)} placeholder="Relevant coursework, achievements, or activities." rows="3" /></label>
            </div>
          ))}
          <button type="button" className="secondary-button" onClick={() => setForm((current) => ({ ...current, education: [...current.education, { ...emptyEducation }] }))}>+ Add Education</button>
        </section>

        <section className="builder-card">
          <SectionHeader number="04" title="Skills" description="Add the tools and strengths you want to highlight." />
          <div className="skill-entry"><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addSkill(event) }} placeholder="e.g. React, Python, Project Management" aria-label="Add a skill" /><button type="button" className="secondary-button" onClick={addSkill}>Add Skill</button></div>
          <div className="tag-list" aria-live="polite">{form.skills.map((skill) => <span className="skill-tag" key={skill}>{skill}<button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>×</button></span>)}</div>
        </section>

        <section className="builder-card">
          <SectionHeader number="05" title="Projects" description="Show the work you are proud of." />
          {form.projects.map((project, index) => (
            <div className="repeatable-card" key={`project-${index}`}>
              <div className="repeatable-heading"><h3>Project {index + 1}</h3><button type="button" className="text-button danger" onClick={() => removeItem('projects', index)}>Remove</button></div>
              <div className="form-grid"><Field label="Project Title" name="title" value={project.title} onChange={(event) => updateSection('projects', index, event)} placeholder="e.g. Campus Events App" /><Field label="Project Link" name="link" type="url" value={project.link} onChange={(event) => updateSection('projects', index, event)} placeholder="https://github.com/..." /></div>
              <label className="form-field"><span>Description</span><textarea name="description" value={project.description} onChange={(event) => updateSection('projects', index, event)} placeholder="What did you build and what was the result?" rows="3" /></label>
              <div className="skill-entry"><input value={projectTechnologyInputs[index] || ''} onChange={(event) => setProjectTechnologyInputs((current) => ({ ...current, [index]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') addProjectTechnology(event, index) }} placeholder="Add a technology, e.g. React" aria-label={`Add technology to project ${index + 1}`} /><button type="button" className="secondary-button" onClick={(event) => addProjectTechnology(event, index)}>Add Technology</button></div>
              <div className="tag-list">{project.technologies.map((technology) => <span className="skill-tag" key={technology}>{technology}<button type="button" onClick={() => setForm((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, technologies: item.technologies.filter((item) => item !== technology) } : item) }))} aria-label={`Remove ${technology}`}>×</button></span>)}</div>
            </div>
          ))}
          <button type="button" className="secondary-button" onClick={() => setForm((current) => ({ ...current, projects: [...current.projects, { ...emptyProject }] }))}>+ Add Project</button>
        </section>

        <section className="builder-card">
          <SectionHeader number="06" title="Experience" description="Add internships, jobs, or meaningful work experience." />
          {form.experience.map((experience, index) => (
            <div className="repeatable-card" key={`experience-${index}`}>
              <div className="repeatable-heading"><h3>Experience {index + 1}</h3><button type="button" className="text-button danger" onClick={() => removeItem('experience', index)}>Remove</button></div>
              <div className="form-grid"><Field label="Job Title" name="jobTitle" value={experience.jobTitle} onChange={(event) => updateSection('experience', index, event)} placeholder="e.g. Frontend Intern" /><Field label="Company" name="company" value={experience.company} onChange={(event) => updateSection('experience', index, event)} placeholder="Company name" /><Field label="Start Date" name="startDate" value={experience.startDate} onChange={(event) => updateSection('experience', index, event)} placeholder="Jun 2023" /><Field label="End Date" name="endDate" value={experience.endDate} onChange={(event) => updateSection('experience', index, event)} placeholder="Aug 2023 or Present" /></div>
              <label className="form-field"><span>Description</span><textarea name="description" value={experience.description} onChange={(event) => updateSection('experience', index, event)} placeholder="Describe your responsibilities and results." rows="3" /></label>
            </div>
          ))}
          <button type="button" className="secondary-button" onClick={() => setForm((current) => ({ ...current, experience: [...current.experience, { ...emptyExperience }] }))}>+ Add Experience</button>
        </section>

        {message.text && <div className={`form-message ${message.type}`} role="alert">{message.text}</div>}
        <div className="form-actions"><button type="button" className="clear-button" onClick={clearForm}>Clear Form</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Resume'}</button></div>
      </form>
    </main>
  )
}

export default ResumeBuilder
