import type { Meta, StoryObj } from '@storybook/react'
import { ConnectionStatus, OfflineBanner } from '@/components/PWA'

const metaConnectionStatus = {
  title: 'Components/PWA/ConnectionStatus',
  component: ConnectionStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConnectionStatus>

export default metaConnectionStatus
type StoryConnectionStatus = StoryObj<typeof metaConnectionStatus>

/**
 * Online Status Badge
 */
export const Online: StoryConnectionStatus = {
  render: () => <ConnectionStatus />,
}

/**
 * Offline Status Badge
 */
export const Offline: StoryConnectionStatus = {
  render: () => {
    // Mock offline status
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
    return <ConnectionStatus />
  },
}

export const OfflineBannerMeta = {
  title: 'Components/PWA/OfflineBanner',
  component: OfflineBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OfflineBanner>

type StoryOfflineBanner = StoryObj<typeof OfflineBannerMeta>

/**
 * Offline Banner - When offline
 */
export const Banner: StoryOfflineBanner = {
  render: () => {
    // Mock offline status
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
    return (
      <div>
        <OfflineBanner />
        <div className="p-4 mt-16">
          <p>Content below banner...</p>
        </div>
      </div>
    )
  },
}

/**
 * Banner Hidden - When online
 */
export const BannerHidden: StoryOfflineBanner = {
  render: () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    })
    return (
      <div>
        <OfflineBanner />
        <div className="p-4">
          <p>Banner is hidden when online</p>
        </div>
      </div>
    )
  },
}
