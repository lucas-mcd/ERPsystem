import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  PWAUpdateNotification,
  useIsInstalledPWA,
  useInstallPrompt,
  ConnectionStatus,
  useOnlineStatus,
  OfflineBanner,
} from '../src/components/PWA'

describe('PWA Components', () => {
  describe('PWAUpdateNotification', () => {
    it('should not show notification initially', () => {
      const { container } = render(<PWAUpdateNotification />)
      expect(container.querySelector('.fixed')).not.toBeInTheDocument()
    })

    it('should show notification when swupdate event is fired', async () => {
      render(<PWAUpdateNotification />)

      const event = new Event('swupdate')
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByText('Atualização Disponível')).toBeInTheDocument()
      })
    })

    it('should hide notification when dismiss button is clicked', async () => {
      render(<PWAUpdateNotification />)

      const event = new Event('swupdate')
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByText('Atualização Disponível')).toBeInTheDocument()
      })

      const dismissButton = screen.getByRole('button', { name: /depois/i })
      fireEvent.click(dismissButton)

      expect(screen.queryByText('Atualização Disponível')).not.toBeInTheDocument()
    })

    it('should reload page when update button is clicked', async () => {
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation()

      render(<PWAUpdateNotification />)

      const event = new Event('swupdate')
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByText('Atualização Disponível')).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /atualizar agora/i })
      fireEvent.click(updateButton)

      expect(reloadSpy).toHaveBeenCalled()
      reloadSpy.mockRestore()
    })
  })

  describe('useIsInstalledPWA hook', () => {
    it('should return false when not installed as PWA', () => {
      function TestComponent() {
        const isInstalled = useIsInstalledPWA()
        return <div>{isInstalled ? 'installed' : 'not-installed'}</div>
      }

      render(<TestComponent />)
      expect(screen.getByText('not-installed')).toBeInTheDocument()
    })

    it('should return true when running as standalone', async () => {
      const mockMatchMedia = jest.fn((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      })

      function TestComponent() {
        const isInstalled = useIsInstalledPWA()
        return <div>{isInstalled ? 'installed' : 'not-installed'}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText('installed')).toBeInTheDocument()
      })
    })
  })

  describe('ConnectionStatus', () => {
    it('should show online status when connected', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      })

      render(<ConnectionStatus />)
      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('should show offline status when disconnected', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      })

      render(<ConnectionStatus />)

      fireEvent.offline(window)

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument()
      })
    })

    it('should update when online/offline events fire', async () => {
      const { rerender } = render(<ConnectionStatus />)

      fireEvent.offline(window)

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument()
      })
    })
  })

  describe('useOnlineStatus hook', () => {
    it('should return online status', async () => {
      function TestComponent() {
        const isOnline = useOnlineStatus()
        return <div>{isOnline ? 'online' : 'offline'}</div>
      }

      render(<TestComponent />)
      expect(screen.getByText('online')).toBeInTheDocument()
    })

    it('should update when connection changes', async () => {
      function TestComponent() {
        const isOnline = useOnlineStatus()
        return <div>{isOnline ? 'online' : 'offline'}</div>
      }

      render(<TestComponent />)

      fireEvent.offline(window)

      await waitFor(() => {
        expect(screen.getByText('offline')).toBeInTheDocument()
      })

      fireEvent.online(window)

      await waitFor(() => {
        expect(screen.getByText('online')).toBeInTheDocument()
      })
    })
  })

  describe('OfflineBanner', () => {
    it('should not show when online', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const { container } = render(<OfflineBanner />)
      expect(container.querySelector('div')).not.toBeInTheDocument()
    })

    it('should show when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      })

      render(<OfflineBanner />)

      fireEvent.offline(window)

      await waitFor(() => {
        expect(
          screen.getByText(
            /você está offline. algumas funcionalidades podem estar limitadas/i
          )
        ).toBeInTheDocument()
      })
    })

    it('should disappear when connection is restored', async () => {
      function TestComponent() {
        return <OfflineBanner />
      }

      render(<TestComponent />)

      fireEvent.offline(window)

      await waitFor(() => {
        expect(
          screen.getByText(
            /você está offline. algumas funcionalidades podem estar limitadas/i
          )
        ).toBeInTheDocument()
      })

      fireEvent.online(window)

      await waitFor(() => {
        expect(
          screen.queryByText(
            /você está offline. algumas funcionalidades podem estar limitadas/i
          )
        ).not.toBeInTheDocument()
      })
    })
  })
})
