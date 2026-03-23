import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary, ErrorFallback, SectionError } from '@/components/ErrorBoundary'

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default Error Boundary - Shows default fallback UI
 */
export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 bg-blue-100 rounded">
        <p>This is a working component inside error boundary</p>
      </div>
    </ErrorBoundary>
  ),
}

/**
 * Error Boundary with custom fallback
 */
export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-8 bg-red-50 border-2 border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Custom Error UI</h2>
          <p>This is a custom error message</p>
        </div>
      }
    >
      <div className="p-4 bg-blue-100 rounded">Working content</div>
    </ErrorBoundary>
  ),
}

/**
 * Error Fallback Component
 */
export const ErrorFallbackComponent: Story = {
  render: () => (
    <ErrorFallback
      error={new Error('Something went wrong in the component')}
      resetError={() => console.log('Reset clicked')}
    />
  ),
}

/**
 * Section Error Component
 */
export const SectionErrorComponent: Story = {
  render: () => (
    <SectionError
      title="Failed to load users"
      message="There was an error loading the user list. Please try again."
      onRetry={() => console.log('Retry clicked')}
    />
  ),
}

/**
 * Section Error without retry button
 */
export const SectionErrorNoRetry: Story = {
  render: () => (
    <SectionError
      title="Access Denied"
      message="You don't have permission to view this content."
    />
  ),
}
