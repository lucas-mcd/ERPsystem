import { useAuth } from '@/context/AuthContext'

export function DebugPage() {
  const { user, token, loading, error, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug: Authentication State</h1>

          <div className="space-y-4">
            <div className="card">
              <strong>Loading:</strong>{' '}
              <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="card">
              <strong>Authenticated:</strong>{' '}
              <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="card">
              <strong>Token:</strong>
              {token ? (
                <div className="text-sm font-mono bg-gray-100 p-2 mt-2 rounded break-all">
                  {token.slice(0, 50)}...{token.slice(-20)}
                </div>
              ) : (
                <span className="text-red-600 ml-2">NONE</span>
              )}
            </div>

            <div className="card">
              <strong>User:</strong>
              {user ? (
                <div className="bg-gray-100 p-2 mt-2 rounded text-sm">
                  <p>ID: {user.id}</p>
                  <p>Email: {user.email}</p>
                  <p>Name: {user.full_name}</p>
                  <p>Role: {user.role}</p>
                </div>
              ) : (
                <span className="text-red-600 ml-2">NO USER</span>
              )}
            </div>

            <div className="card">
              <strong>Error:</strong>{' '}
              {error ? (
                <span className="text-red-600 ml-2">{error}</span>
              ) : (
                <span className="text-green-600 ml-2">NONE</span>
              )}
            </div>

            <div className="mt-8">
              <a href="/login" className="btn-primary inline-block">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
