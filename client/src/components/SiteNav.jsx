import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function SiteNav({ activePath = window.location.pathname }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authStatus, setAuthStatus] = useState(() => localStorage.getItem('token') ? 'checking' : 'guest')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: ['Bearer', token].join(' ') },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to verify the current session.')
        }
        return response.json()
      })
      .then((data) => {
        setIsAdmin(data.user?.role === 'admin')
        setAuthStatus('authenticated')
      })
      .catch(() => {
        setIsAdmin(false)
        setAuthStatus('guest')
      })
  }, [])

  const links = [
    ['/', 'Home'],
    ['/my-resumes', 'My Resumes'],
    ['/jobs', 'Jobs'],
    ['/applications', 'Applications'],
    ['/job-matches', 'AI Job Matches'],
  ]

  const authenticatedLinks = [
    ...links,
    ['/profile', 'Profile'],
  ]
  const publicLinks = [
    ['/', 'Home'],
    ['/jobs', 'Jobs'],
  ]

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <a className="brand" href="/" onClick={() => setIsOpen(false)}>CareerPilot AI</a>
      <button
        className="nav-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="primary-navigation"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div id="primary-navigation" className={`nav-links${isOpen ? ' nav-links-open' : ''}${isAdmin ? ' admin-nav-links' : ''}`}>
        {authStatus === 'authenticated' && isAdmin ? (
          <>
            <a className={activePath === '/admin' ? 'active-link' : ''} href="/admin" onClick={() => setIsOpen(false)}>Admin Dashboard</a>
            <a className={activePath === '/admin/jobs' ? 'active-link' : ''} href="/admin/jobs" onClick={() => setIsOpen(false)}>Admin Jobs</a>
            <a className={activePath === '/admin/applications' ? 'active-link' : ''} href="/admin/applications" onClick={() => setIsOpen(false)}>Admin Applications</a>
            <a className={activePath === '/profile' ? 'active-link' : ''} href="/profile" onClick={() => setIsOpen(false)}>Profile</a>
            <a href="/" onClick={() => setIsOpen(false)}>Back to Website</a>
            <button className="nav-logout" type="button" onClick={() => { localStorage.removeItem('token'); window.location.assign('/login') }}>Logout</button>
          </>
        ) : authStatus === 'authenticated' ? (
          <>
            {authenticatedLinks.map(([href, label]) => (
              <a key={href} className={activePath === href ? 'active-link' : ''} href={href} onClick={() => setIsOpen(false)}>{label}</a>
            ))}
            <button className="nav-logout" type="button" onClick={() => { localStorage.removeItem('token'); window.location.assign('/login') }}>Logout</button>
          </>
        ) : authStatus === 'guest' ? (
          <>
            {publicLinks.map(([href, label]) => (
              <a key={href} className={activePath === href ? 'active-link' : ''} href={href} onClick={() => setIsOpen(false)}>{label}</a>
            ))}
            <a className="nav-login" href="/login" onClick={() => setIsOpen(false)}>Login</a>
            <a className="nav-register" href="/register" onClick={() => setIsOpen(false)}>Register</a>
          </>
        ) : null}
      </div>
    </nav>
  )
}

export default SiteNav
