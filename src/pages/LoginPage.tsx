import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../auth/session'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const { me, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (me) return <Navigate to={me.role === 'superadmin' ? '/admin' : '/'} replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError((err as Error).message)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <form className="glass auth-card" onSubmit={onSubmit} noValidate>
        <Logo />
        <h1>Sign in</h1>
        <p className="sub">Manage your gym's members and renewals.</p>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button className="btn block" type="submit" disabled={submitting || !email || !password}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="notice">
          <b>Privacy notice.</b> Najah stores member names, phone numbers, membership dates and payment records. Data is encrypted in transit, used
          only to track memberships and renewals, and each gym can see only its own records.
        </div>
      </form>
    </section>
  )
}
