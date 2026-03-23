interface MessageProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export function Message({ type, message, onClose }: MessageProps) {
  const backgrounds = {
    error: '#fee',
    success: '#efe',
    warning: '#fef3cd',
    info: '#e7f3ff',
  }

  const borders = {
    error: '#f44336',
    success: '#4CAF50',
    warning: '#ff9800',
    info: '#2196F3',
  }

  const icons = {
    error: '!',
    success: '✓',
    warning: '!',
    info: 'i',
  }

  return (
    <div style={{
      padding: '12px 16px',
      marginBottom: '15px',
      borderRadius: '4px',
      backgroundColor: backgrounds[type],
      borderLeft: `4px solid ${borders[type]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icons[type]}</span>
        <span style={{
          color: borders[type],
          fontWeight: '500',
        }}>
          {message}
        </span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            color: borders[type],
            fontWeight: 'bold',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
