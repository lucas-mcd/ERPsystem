import type { Meta, StoryObj } from '@storybook/react'
import { I18nProvider } from '@/contexts/I18nContext'
import { LanguageSelector, LanguageSelectorButtons } from '@/components/I18n/LanguageSelector'

const meta = {
  title: 'Components/I18n/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LanguageSelector>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Language Selector Dropdown (Default)
 */
export const Dropdown: Story = {
  render: () => (
    <I18nProvider>
      <div className="p-4">
        <LanguageSelector />
      </div>
    </I18nProvider>
  ),
}

/**
 * Language Selector with Buttons
 */
export const Buttons: Story = {
  render: () => (
    <I18nProvider>
      <div className="p-4">
        <LanguageSelectorButtons />
      </div>
    </I18nProvider>
  ),
}

/**
 * Language Selector in Light Mode
 */
export const LightMode: Story = {
  render: () => (
    <div>
      <I18nProvider>
        <div className="p-4 bg-white">
          <LanguageSelector />
        </div>
      </I18nProvider>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'light' },
  },
}

/**
 * Language Selector in Dark Mode
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <I18nProvider>
        <div className="p-4 bg-gray-900">
          <LanguageSelector />
        </div>
      </I18nProvider>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
}
