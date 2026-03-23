import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  onBack?: () => void
}

export function Header({ title, onBack }: HeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '30px',
      paddingBottom: '15px',
      borderBottom: '2px solid #ddd',
    }}>
      <button
        onClick={handleBack}
        style={{
          padding: '8px 16px',
          backgroundColor: '#666',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        ← Voltar
      </button>
      <h1 style={{ margin: 0, fontSize: '28px', flex: 1 }}>
        {title}
      </h1>
    </div>
  )
}
