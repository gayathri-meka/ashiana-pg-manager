import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function HomeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-300 flex justify-center">
      <div
        className="w-full max-w-[430px] min-h-screen flex flex-col"
        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.22)' }}
      >
        {/* Top gradient hero */}
        <div
          className="flex-1 flex flex-col items-center justify-center text-white px-8 pt-16 pb-10"
          style={{ background: 'linear-gradient(160deg, #14532d 0%, #16a34a 100%)' }}
        >
          <div className="mb-4 opacity-90">
            <HomeIcon />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight">Ashiana PG</h1>
          <p className="text-green-200 text-sm tracking-[0.15em] uppercase mt-1 font-medium">
            Home Away From Home
          </p>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-8 opacity-30">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>
        </div>

        {/* Sign-in card */}
        <div className="bg-white px-6 pt-8 pb-10">
          <h2 className="text-xl font-bold text-gray-900 text-center">Welcome back</h2>
          <p className="text-gray-400 text-sm text-center mt-1 mb-8">
            Sign in to manage your PG
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 py-4 rounded-2xl text-sm font-semibold text-gray-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>

          {error && (
            <p className="text-red-500 text-xs text-center mt-4">{error}</p>
          )}

          <p className="text-gray-300 text-xs text-center mt-6">
            Access is restricted to approved admins only
          </p>
        </div>
      </div>
    </div>
  )
}
