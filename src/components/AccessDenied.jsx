import { useAuth } from '../context/AuthContext.jsx'

export default function AccessDenied({ user }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-stone-300 flex justify-center">
      <div
        className="w-full max-w-[430px] min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center"
        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.22)' }}
      >
        <div className="text-5xl mb-5">🔒</div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
          <span className="font-medium text-gray-700">{user.email}</span>
          {' '}is not an approved admin.
        </p>
        <p className="text-gray-400 text-xs mt-3">
          Ask an existing admin to add your email in Settings.
        </p>

        <button
          onClick={signOut}
          className="mt-8 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl active:bg-gray-200 text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
