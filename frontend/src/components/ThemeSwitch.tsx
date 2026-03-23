import { useTheme } from '@/contexts/ThemeContext'

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()

  return (
    <label 
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        gap: '8px',
      }}
    >
      <input
        type="checkbox"
        checked={theme === 'dark'}
        onChange={toggleTheme}
        style={{ display: 'none' }}
      />
      
      <div style={{
        position: 'relative',
        width: '50px',
        height: '28px',
        backgroundColor: theme === 'dark' ? '#444' : '#ccc',
        borderRadius: '14px',
        transition: 'background-color 0.3s',
        border: '2px solid #999',
      }}>
        <div style={{
          position: 'absolute',
          top: '2px',
          left: theme === 'dark' ? '24px' : '2px',
          width: '20px',
          height: '20px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transition: 'left 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
        }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>
      </div>
      
      <span style={{ fontSize: '14px', fontWeight: '500' }}>
        {theme === 'light' ? 'Modo Claro' : 'Modo Escuro'}
      </span>
    </label>
  )
}
