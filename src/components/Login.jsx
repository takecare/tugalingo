import { useState } from 'react'

export default function Login({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await onSignIn(email)
      setStatus('sent')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="login">
        <h1>tugalingo</h1>
        <p>Check {email} for a sign-in link.</p>
      </div>
    )
  }

  return (
    <div className="login">
      <h1>tugalingo</h1>
      <p>Sign in with your email to save your progress.</p>
      <form className="login__form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login__input"
        />
        <button type="submit" className="login__button" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>
      {error && <p className="login__error">{error}</p>}
    </div>
  )
}
