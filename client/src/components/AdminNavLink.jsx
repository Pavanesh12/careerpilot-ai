import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setIsAdmin(data?.user?.role === 'admin'))
      .catch(() => setIsAdmin(false))
  }, [])

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <a href="/admin">Admin Dashboard</a>
      <a href="/admin/jobs">Admin Jobs</a>
      <a href="/admin/applications">Admin Applications</a>
    </>
  )
}

export default AdminNavLink
