export function TestSetupPage() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3MDMwNjgyOH0.HOwCaL7wdFFZFtActOyxigVWujEJvmSWhjYSBUO8Ir4'

  const handleSetupToken = () => {
    localStorage.setItem('token', token)
    window.location.href = '/clients'
  }

  const handleClearToken = () => {
    localStorage.removeItem('token')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Setup</h1>

          <div className="space-y-4">
            <p className="text-gray-600">
              This page is for testing only. It allows you to inject a valid token and test the pages.
            </p>

            <div className="card bg-blue-50 border border-blue-200">
              <p className="text-blue-900 font-semibold mb-3">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-2 text-blue-900">
                <li>Click "Setup Token & Go to Clients" below</li>
                <li>This will inject a valid auth token and redirect you to /clients</li>
                <li>All pages should now load correctly</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button onClick={handleSetupToken} className="btn-primary">
                Setup Token & Go to Clients
              </button>
              <button onClick={handleClearToken} className="btn-secondary">
                Clear Token
              </button>
            </div>

            <div className="card bg-yellow-50 border border-yellow-200">
              <p className="text-yellow-900 font-semibold mb-2">Current Token:</p>
              <div className="text-sm font-mono bg-white p-2 rounded break-all">
                {token.slice(0, 50)}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
