import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/dateUtils.js'

function Avatar({ email }) {
  const initials = email.split('@')[0].slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  )
}

export default function SettingsPage({ onBack }) {
  const { user, signOut } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [removingEmail, setRemovingEmail] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      const list = snap.docs.map(d => ({ email: d.id, ...d.data() }))
      list.sort((a, b) => {
        // Sort by addedAt ascending
        const ta = a.addedAt?.seconds ?? 0
        const tb = b.addedAt?.seconds ?? 0
        return ta - tb
      })
      setAdmins(list)
      setLoadingAdmins(false)
    })
    return unsub
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setAddError('')
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    if (!email.includes('@') || !email.includes('.')) {
      return setAddError('Enter a valid email address.')
    }
    if (admins.some(a => a.email === email)) {
      return setAddError('This email is already an admin.')
    }
    setAdding(true)
    try {
      await setDoc(doc(db, 'admins', email), {
        addedBy: user.email,
        addedAt: serverTimestamp(),
      })
      setNewEmail('')
    } catch {
      setAddError('Failed to add admin. Check your connection.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(email) {
    if (email === user.email) return
    if (admins.length <= 1) return
    setRemovingEmail(email)
    try {
      await deleteDoc(doc(db, 'admins', email))
    } catch {
      // silently fail, listener will re-sync
    } finally {
      setRemovingEmail(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="shrink-0 text-white px-5 pb-6 pt-safe"
        style={{ background: 'linear-gradient(160deg, #14532d 0%, #16a34a 100%)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/70 text-sm mb-5 active:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-green-200 text-sm mt-0.5">Manage admins & account</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-5 space-y-5 pb-10">

        {/* ── Admins section ── */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Admins</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Only admins can access this app.
            </p>
          </div>

          {/* Admin list */}
          {loadingAdmins ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {admins.map(admin => {
                const isSelf = admin.email === user.email
                const isLast = admins.length === 1
                const isRemoving = removingEmail === admin.email
                return (
                  <div key={admin.email} className="flex items-center gap-3 px-4 py-3.5">
                    <Avatar email={admin.email} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {admin.email}
                        </span>
                        {isSelf && (
                          <span className="shrink-0 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {admin.addedAt
                          ? `Added ${formatDate(new Date(admin.addedAt.seconds * 1000).toISOString())}`
                          : 'Initial admin'}
                        {admin.addedBy && admin.addedBy !== admin.email && (
                          <span> by {admin.addedBy.split('@')[0]}</span>
                        )}
                      </div>
                    </div>

                    {!isSelf && !isLast && (
                      <button
                        onClick={() => handleRemove(admin.email)}
                        disabled={isRemoving}
                        className="shrink-0 text-xs text-red-400 font-semibold px-3 py-1.5 bg-red-50 rounded-lg active:bg-red-100 disabled:opacity-40"
                      >
                        {isRemoving ? '…' : 'Remove'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Add admin form */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-50">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Add Admin
            </p>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setAddError('') }}
                placeholder="email@example.com"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 min-w-0"
              />
              <button
                type="submit"
                disabled={adding || !newEmail.trim()}
                className="shrink-0 text-white font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-40 active:opacity-80"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
              >
                {adding ? '…' : 'Add'}
              </button>
            </form>
            {addError && (
              <p className="text-red-500 text-xs mt-2">{addError}</p>
            )}
          </div>
        </section>

        {/* ── Account section ── */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Your Account</h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-11 h-11 rounded-full"
              />
            ) : (
              <Avatar email={user.email} />
            )}
            <div className="flex-1 min-w-0">
              {user.displayName && (
                <div className="text-sm font-bold text-gray-900 truncate">{user.displayName}</div>
              )}
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={signOut}
              className="w-full bg-red-50 text-red-500 font-semibold py-3 rounded-2xl active:bg-red-100 text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* ── App info ── */}
        <div className="text-center text-xs text-gray-300 pb-2">
          Ashiana PG Manager · v1.0
        </div>
      </div>
    </div>
  )
}
