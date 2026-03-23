import { useEffect, useState } from 'react'

export function SimpleTestPage() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    console.log('SimpleTestPage mounted')
    setMessage('Page loaded successfully! Token is set in localStorage.')
    
    const token = localStorage.getItem('token')
    console.log('Token in localStorage:', token ? 'YES' : 'NO')
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Test Page</h1>
      <p style={{ fontSize: '18px', color: 'green', fontWeight: 'bold' }}>
        {message}
      </p>
      <hr />
      <h2>Debug Info:</h2>
      <p>
        <strong>Token present:</strong> {localStorage.getItem('token') ? 'YES' : 'NO'}
      </p>
      <p>
        <strong>Page location:</strong> {window.location.pathname}
      </p>
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Logout
        </button>
        <button
          onClick={() => {
            window.location.href = '/clients'
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginLeft: '10px',
          }}
        >
          Go to Clients
        </button>
      </div>
    </div>
  )
}
