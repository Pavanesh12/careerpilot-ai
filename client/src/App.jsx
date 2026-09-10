import './App.css'

function App() {
  return (
    <main className="app-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="#home">ResumeMatch</a>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#resume-builder">Resume Builder</a>
          <a href="#jobs">Jobs</a>
          <a href="#applications">Applications</a>
          <a className="nav-login" href="#login">Login</a>
        </div>
      </nav>

      <section className="hero-section" id="home">
        <p className="eyebrow">AI Resume Builder &amp; Job Matching Platform</p>
        <h1>AI Resume Builder &amp; Job Matching Platform</h1>
        <p className="intro">
          Create a professional resume, improve your resume with AI, and
          discover job opportunities that match your skills.
        </p>
        <div className="status-card" role="status">
          <span className="status-dot" aria-hidden="true" />
          <span>Build your career with confidence</span>
        </div>
      </section>

      <section className="features-section" aria-labelledby="features-heading">
        <div className="section-heading">
          <p className="eyebrow">Everything you need</p>
          <h2 id="features-heading">Move from resume to opportunity.</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card" id="resume-builder">
            <span className="feature-number">01</span>
            <h2>AI Resume Builder</h2>
            <p>
              Create and manage a professional resume with education, skills,
              projects and experience.
            </p>
          </article>
          <article className="feature-card" id="jobs">
            <span className="feature-number">02</span>
            <h2>AI Job Matching</h2>
            <p>
              Compare your resume with job descriptions and receive an
              AI-powered match score and recommendations.
            </p>
          </article>
          <article className="feature-card" id="applications">
            <span className="feature-number">03</span>
            <h2>Application Tracker</h2>
            <p>
              Apply for jobs and track the status of your applications.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
