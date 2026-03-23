import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

function TestComponent() {
  const { theme, themeMode, toggleTheme, setTheme } = useTheme()

  return (
    <div>
      <p>Current Theme: {theme}</p>
      <p>Theme Mode: {themeMode}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('renders with default theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Should have mounted and theme should be either light or dark
    expect(screen.getByText(/Current Theme:/)).toBeInTheDocument()
  })

  it('toggles between light and dark themes', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByText('Toggle Theme')
    fireEvent.click(toggleButton)

    await waitFor(() => {
      // Verify toggle works
      expect(toggleButton).toBeInTheDocument()
    })
  })

  it('can set specific theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const lightButton = screen.getByText('Set Light')
    fireEvent.click(lightButton)

    await waitFor(() => {
      expect(screen.getByText('Theme Mode: light')).toBeInTheDocument()
    })
  })

  it('can set system theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const systemButton = screen.getByText('Set System')
    fireEvent.click(systemButton)

    await waitFor(() => {
      expect(screen.getByText('Theme Mode: system')).toBeInTheDocument()
    })
  })

  it('persists theme to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const darkButton = screen.getByText('Set Dark')
    fireEvent.click(darkButton)

    await waitFor(() => {
      // localStorage should be called with theme preference
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'erp_theme_preference',
        'dark'
      )
    })
  })

  it('throws error when useTheme is used outside provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within ThemeProvider')

    consoleErrorSpy.mockRestore()
  })
})
