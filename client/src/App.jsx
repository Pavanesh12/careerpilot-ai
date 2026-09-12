import './App.css'
import { useEffect, useState } from 'react'
import API_URL from './config/api.js'
import SiteNav from './components/SiteNav.jsx'
import AdminJobs from './pages/AdminJobs.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Applications from './pages/Applications.jsx'
import ApplicationForm from './pages/ApplicationForm.jsx'
import AdminApplications from './pages/AdminApplications.jsx'
import Auth from './pages/Auth.jsx'
import JobMatches from './pages/JobMatches.jsx'
import Jobs from './pages/Jobs.jsx'
import MyResumes from './pages/MyResumes.jsx'
import Profile from './pages/Profile.jsx'
import ResumeBuilder from './ResumeBuilder.jsx'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    function updatePath() {
      setPathname(window.location.pathname)
    }

    function handleInternalLink(event) {
      const link = event.target.closest('a')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const url = new URL(link.href, window.location.origin)
      if (url.origin !== window.location.origin) return

      event.preventDefault()
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
      updatePath()
    }

    window.addEventListener('popstate', updatePath)
    document.addEventListener('click', handleInternalLink, true)
    return () => {
      window.removeEventListener('popstate', updatePath)
      document.removeEventListener('click', handleInternalLink, true)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: ['Bearer', token].join(' ') },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setIsAdmin(data?.user?.role === 'admin'))
      .catch(() => setIsAdmin(false))
  }, [])

  function withNavigation(page) {
    return (
      <>
        <div className="app-navigation-shell">
          <SiteNav activePath={pathname} />
        </div>
        {page}
      </>
    )
  }

  if (pathname === '/my-resumes') {
    return withNavigation(<MyResumes />)
  }

  if (pathname === '/profile') {
    return withNavigation(<Profile />)
  }

  if (pathname === '/resume-builder') {
    return withNavigation(<MyResumes />)
  }

  if (pathname === '/resume-builder/new') {
    return withNavigation(<ResumeBuilder mode="new" />)
  }

  if (pathname.startsWith('/resume-builder/')) {
    return withNavigation(<ResumeBuilder mode="edit" resumeId={pathname.split('/')[2]} />)
  }

  if (pathname.startsWith('/resume-preview/')) {
    return withNavigation(<ResumeBuilder mode="preview" resumeId={pathname.split('/')[2]} />)
  }

  if (pathname === '/jobs') {
    return withNavigation(<Jobs />)
  }

  if (pathname.startsWith('/jobs/') && pathname.endsWith('/apply')) {
    return withNavigation(<ApplicationForm jobId={pathname.split('/')[2]} />)
  }

  if (pathname === '/applications') {
    return withNavigation(<Applications />)
  }

  if (pathname === '/job-matches') {
    return withNavigation(<JobMatches />)
  }

  if (pathname === '/admin/jobs') {
    return withNavigation(<AdminJobs />)
  }

  if (pathname === '/admin') {
    return withNavigation(<AdminDashboard />)
  }

  if (pathname === '/admin/applications') {
    return withNavigation(<AdminApplications />)
  }

  if (pathname === '/login' || pathname === '/register') {
    return withNavigation(<Auth />)
  }

  return withNavigation(
    <main className="app-shell home-shell">

      <section className="home-hero" id="home">
        <div className="hero-section">
          <p className="home-badge">✦ Powered by AI</p>
          {isAdmin ? (
            <>
              <h1>Manage CareerPilot <span>AI.</span></h1>
              <p className="intro">Manage jobs, applications, and platform activity from one place.</p>
              <div className="hero-actions"><a className="primary-button" href="/admin">Go to Admin Dashboard</a></div>
            </>
          ) : (
            <>
              <h1>Build Your Career<br />with <span>Confidence.</span></h1>
              <p className="intro">Create professional resumes, discover the right jobs,<br className="hero-desktop-break" /> get AI-powered insights, and land your dream career — all in one place.</p>
              <div className="hero-actions"><a className="primary-button" href="/resume-builder/new">Create My Resume →</a><a className="secondary-button" href="/jobs">Explore Jobs</a></div>
            </>
          )}
        </div>
        <div className="hero-visual">
          <img src="/career-hero.png" alt="Career growth and AI insights" />
        </div>
      </section>

      <section className="features-section" aria-labelledby="features-heading">
        <div className="section-heading">
          <p className="eyebrow">Everything you need</p>
          <h2 id="features-heading">Move from resume to opportunity.</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card" id="resume-builder">
            <div className="feature-card-top"><span className="feature-icon">✦</span><a href="/resume-builder/new" className="feature-arrow" aria-label="Create a professional resume">↗</a></div>
            <h2>Create Professional Resumes</h2><p>Build modern, ATS-friendly resumes with AI assistance.</p>
          </article>
          <article className="feature-card" id="jobs">
            <div className="feature-card-top"><span className="feature-icon">⌁</span><a href="/jobs" className="feature-arrow" aria-label="Find relevant jobs">↗</a></div>
            <h2>Find Relevant Jobs</h2><p>Discover job opportunities that match your skills and interests.</p>
          </article>
          <article className="feature-card" id="applications">
            <div className="feature-card-top"><span className="feature-icon">◈</span><a href="/job-matches" className="feature-arrow" aria-label="Get AI-powered insights">↗</a></div>
            <h2>Get AI-Powered Insights</h2><p>Receive personalized recommendations to improve your chances.</p>
          </article>
          <article className="feature-card" id="goals">
            <div className="feature-card-top"><span className="feature-icon">↗</span><a href="/applications" className="feature-arrow" aria-label="Track progress toward career goals">↗</a></div>
            <h2>Achieve Your Goals</h2><p>Track your progress and take steps toward a brighter future.</p>
          </article>
        </div>
      </section>
    </main>,
  )
}

export default App
