import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'
const emptyProfile = { name: '', email: '', phone: '', location: '', linkedin: '', github: '', experienceLevel: '' }

function Profile() {
  const [user, setUser] = useState(emptyProfile)
  const [isAdmin, setIsAdmin] = useState(false)
  const [form, setForm] = useState(emptyProfile)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.assign('/login')
      return
    }

    fetch(`${API_URL}/auth/me`, { headers: { Authorization: ['Bearer', token].join(' ') } })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign('/login')
          return null
        }
        if (!response.ok) throw new Error('Unable to load profile')
        return response.json()
      })
      .then((data) => {
        if (!data?.user) return
        setUser(data.user)
        setForm({ ...emptyProfile, ...data.user })
        setIsAdmin(data.user.role === 'admin')
      })
      .catch(() => setMessage({ type: 'error', text: 'Unable to load your profile. Please try again.' }))
      .finally(() => setIsLoading(false))
  }, [])

  function updateProfileField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updatePasswordField(event) {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', localStorage.getItem('token')].join(' ') },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to save profile')
      setUser(data.user)
      setForm({ ...emptyProfile, ...data.user })
      setMessage({ type: 'success', text: 'Profile changes saved successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordMessage({ type: '', text: '' })
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setIsChangingPassword(true)
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', localStorage.getItem('token')].join(' ') },
        body: JSON.stringify(passwordForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to change password')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' })
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) return <main className="profile-shell"><p className="applications-status">Loading profile...</p></main>

  return (
    <main className="profile-shell">
      <header className="profile-intro">
        <p className="eyebrow">{isAdmin ? 'Administrator account' : 'Your account'}</p>
        <h1>{isAdmin ? 'Admin Profile' : 'Profile'}</h1>
        <p>{isAdmin ? 'Manage your account information.' : 'Manage your personal information and account settings.'}</p>
      </header>

      <div className="profile-layout">
        <section className="profile-card builder-card">
          <div className="profile-card-heading">
            <div><p className="eyebrow">Account details</p><h2>{isAdmin ? 'Administrator information' : 'Personal information'}</h2></div>
            {isAdmin && <span className="profile-role-badge">Administrator</span>}
          </div>
          <form onSubmit={saveProfile}>
            <div className="form-grid">
              <label className="form-field"><span>Full Name</span><input name="name" value={form.name} onChange={updateProfileField} required /></label>
              <label className="form-field"><span>Email</span><input name="email" value={form.email} readOnly /></label>
              <label className="form-field"><span>Phone</span><input name="phone" value={form.phone} onChange={updateProfileField} /></label>
              <label className="form-field"><span>Location</span><input name="location" value={form.location} onChange={updateProfileField} /></label>
              <label className="form-field"><span>LinkedIn</span><input name="linkedin" value={form.linkedin} onChange={updateProfileField} placeholder="https://linkedin.com/in/..." /></label>
              <label className="form-field"><span>GitHub</span><input name="github" value={form.github} onChange={updateProfileField} placeholder="https://github.com/..." /></label>
              {!isAdmin && <label className="form-field"><span>Experience Level</span><select name="experienceLevel" value={form.experienceLevel} onChange={updateProfileField}><option value="">Select experience level</option><option>Fresher</option><option>0-1 years</option><option>1-3 years</option><option>3+ years</option></select></label>}
              {isAdmin && <label className="form-field"><span>Role</span><input value="Administrator" readOnly /></label>}
            </div>
            {isAdmin && user.createdAt && <p className="profile-created">Account created {new Date(user.createdAt).toLocaleDateString()}</p>}
            {message.text && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
            <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </section>

        <section className="profile-card builder-card">
          <div className="profile-card-heading"><div><p className="eyebrow">Security</p><h2>Change Password</h2></div></div>
          <form onSubmit={changePassword}>
            <label className="form-field"><span>Current Password</span><input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={updatePasswordField} required /></label>
            <label className="form-field"><span>New Password</span><input type="password" name="newPassword" value={passwordForm.newPassword} onChange={updatePasswordField} minLength="6" required /></label>
            <label className="form-field"><span>Confirm New Password</span><input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={updatePasswordField} minLength="6" required /></label>
            {passwordMessage.text && <p className={`form-message ${passwordMessage.type}`} role="status">{passwordMessage.text}</p>}
            <button className="primary-button" type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Updating...' : 'Change Password'}</button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Profile
