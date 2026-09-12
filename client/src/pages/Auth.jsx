import { useState } from 'react'
import API_URL from '../config/api.js'

function Auth() {
  const [isRegistering, setIsRegistering] = useState(() => window.location.pathname === '/register')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setMessage({ type: '', text: '' })
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/${isRegistering ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to authenticate.')
      }

      localStorage.setItem('token', data.token)
      let authenticatedUser = data.user
      if (!authenticatedUser?.role) {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: ['Bearer', data.token].join(' ') },
        })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          authenticatedUser = userData.user
        }
      }

      window.location.assign(authenticatedUser?.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to authenticate.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode() {
    setIsRegistering((current) => !current)
    setForm({ name: '', email: '', password: '' })
    setMessage({ type: '', text: '' })
  }

  const benefits = [
    ['✦', 'Create Professional Resumes', 'With AI assistance'],
    ['⌁', 'Find Relevant Jobs', 'Match with top opportunities'],
    ['◈', 'Get AI Insights', 'Improve your chances'],
    ['↗', 'Achieve Your Goals', 'Build the future you deserve'],
  ]

  return (
    <main className="auth-shell">
      <section className="auth-layout">
        <div className="auth-brand-panel">
          <span className="auth-badge">✦ Powered by AI</span>
          <h1>Start Your Career Journey <span>Today</span></h1>
          <p className="auth-brand-copy">Build better resumes. Discover the right jobs.<br className="auth-desktop-break" /> Get AI-powered insights. Land your dream career.</p>
          <div className="auth-benefits">
            {benefits.map(([icon, title, description]) => (
              <div className="auth-benefit" key={title}>
                <span className="auth-benefit-icon" aria-hidden="true">{icon}</span>
                <div><strong>{title}</strong><span>{description}</span></div>
              </div>
            ))}
          </div>
          <div className="auth-journey-visual" aria-hidden="true"><span>✦</span><i /><b /><em /></div>
          <p className="auth-motto">A Smarter Way to a Brighter Future</p>
        </div>

        <section className="auth-card">
          <div className="auth-card-intro">
            <span className="auth-card-mark" aria-hidden="true">✦</span>
            <p className="eyebrow">{isRegistering ? 'Join CareerPilot AI 🚀' : 'Welcome back'}</p>
            <h2>{isRegistering ? 'Create Your Account' : 'Welcome Back'}</h2>
            <p>{isRegistering ? 'Start building your career with smarter tools.' : 'Continue your journey toward a brighter career.'}</p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {isRegistering && <label className="form-field"><span>Full name</span><input name="name" value={form.name} onChange={updateField} placeholder="Enter your full name" autoComplete="name" required /></label>}
            <label className="form-field"><span>Email address</span><input type="email" name="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required /></label>
            <label className="form-field"><span>Password</span><input type="password" name="password" value={form.password} onChange={updateField} placeholder="At least 6 characters" autoComplete={isRegistering ? 'new-password' : 'current-password'} minLength="6" required /></label>
            {message.text && <p className={`form-message ${message.type}`} role="alert">{message.text}</p>}
            <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Creating your account...' : isRegistering ? 'Create Account →' : 'Sign In →'}</button>
          </form>
          <p className="auth-switch-copy">
            {isRegistering ? 'Already have an account?' : 'New to CareerPilot AI?'}{' '}
            <button type="button" className="text-button auth-switch" onClick={switchMode}>{isRegistering ? 'Sign In' : 'Create an account'}</button>
          </p>
        </section>
      </section>
    </main>
  )
}

export default Auth
