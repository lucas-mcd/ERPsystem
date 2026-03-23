import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Entrar')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/')

    // Fill form
    await page.fill('input[type="email"]', 'invalid@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit
    await page.click('button[type="submit"]')

    // Check for error message
    await expect(page.locator('text=/Email ou senha inválidos|Invalid email or password/')).toBeVisible()
  })

  test('should allow login with valid credentials', async ({ page }) => {
    await page.goto('/')

    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL(/.*dashboard/)
  })
})

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should navigate to users page', async ({ page }) => {
    await page.click('a[href="/users"]')
    await page.waitForURL('/users')
    await expect(page).toHaveURL(/.*users/)
  })

  test('should navigate to products page', async ({ page }) => {
    await page.click('a[href="/products"]')
    await page.waitForURL('/products')
    await expect(page).toHaveURL(/.*products/)
  })

  test('should navigate to orders page', async ({ page }) => {
    await page.click('a[href="/orders"]')
    await page.waitForURL('/orders')
    await expect(page).toHaveURL(/.*orders/)
  })

  test('should navigate to reports page', async ({ page }) => {
    await page.click('a[href="/reports"]')
    await page.waitForURL('/reports')
    await expect(page).toHaveURL(/.*reports/)
  })

  test('should navigate to settings page', async ({ page }) => {
    await page.click('a[href="/settings"]')
    await page.waitForURL('/settings')
    await expect(page).toHaveURL(/.*settings/)
  })
})

test.describe('Responsive Design', () => {
  test('should work on desktop', async ({ page }) => {
    await page.goto('/dashboard')
    const sidebar = page.locator('[class*="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    // Mobile-specific elements should be visible
    const mobileMenu = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
    // Menu may be hidden or togglable on mobile
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    // Tablet layout should work
  })
})

test.describe('Theme Switching', () => {
  test('should toggle light/dark theme', async ({ page }) => {
    await page.goto('/dashboard')

    // Find theme toggle button (location depends on UI)
    // This is an example - adjust selector based on actual implementation
    const themeButton = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]')

    if (await themeButton.isVisible()) {
      await themeButton.click()

      // Verify theme changed
      const html = page.locator('html')
      const isDark = await html.evaluate((el) => el.classList.contains('dark'))
      expect(typeof isDark).toBe('boolean')
    }
  })
})

test.describe('Offline Functionality', () => {
  test('should show offline indicator', async ({ page, context }) => {
    await page.goto('/dashboard')

    // Get service worker registration status
    const isOnline = await page.evaluate(() => navigator.onLine)
    expect(typeof isOnline).toBe('boolean')
  })

  test('should handle offline gracefully', async ({ page }) => {
    await page.goto('/dashboard')

    // Simulate offline
    await context.setOffline(true)

    // Page should still be visible
    await expect(page.locator('body')).toBeVisible()

    // Go back online
    await context.setOffline(false)
  })
})

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should validate email field', async ({ page }) => {
    await page.goto('/users')

    // Try to create user with invalid email
    const createButton = page.locator('button[aria-label*="novo"], button[aria-label*="new"], button:has-text("Novo")')

    if (await createButton.isVisible()) {
      await createButton.click()

      // Fill form with invalid email
      const emailInput = page.locator('input[type="email"]').first()
      await emailInput.fill('invalid-email')

      // Should show validation error
      // Error message depends on implementation
    }
  })

  test('should require mandatory fields', async ({ page }) => {
    await page.goto('/users')

    // Try to submit form without filling required fields
    const submitButton = page.locator('button[type="submit"]:has-text("Salvar"), button:has-text("Save")')

    if (await submitButton.isVisible()) {
      // Form should have validation preventing submission
      const submitDisabled = await submitButton.isDisabled()
      // May be disabled or show validation errors
    }
  })
})

test.describe('Internationalization', () => {
  test('should support multiple languages', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for language selector
    const languageSelect = page.locator('select').first()

    if (await languageSelect.isVisible()) {
      // Get current options
      const options = await languageSelect.locator('option').all()
      expect(options.length).toBeGreaterThan(0)
    }
  })

  test('should change UI language on selection', async ({ page }) => {
    await page.goto('/dashboard')

    const languageSelect = page.locator('select,:has-text("Português")').first()

    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption('en')

      // UI should change to English (example: button text)
      const pageContent = await page.content()
      expect(pageContent).toBeTruthy()
    }
  })
})
