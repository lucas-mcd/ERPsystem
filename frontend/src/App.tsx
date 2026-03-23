import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ConfirmDialogProvider } from '@/context/ConfirmDialogContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute } from '@/hooks/useAuth'
import { useAppInitialization } from '@/hooks/useAppInitialization'
import { PWAUpdateNotification, OfflineBanner } from '@/components/PWA'
import { GitHubButton } from '@/components/GitHubButton'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { UsersPage } from '@/pages/UsersPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { OrdersManagementPage } from '@/pages/OrdersManagementPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { AdvancedReportsPage } from '@/pages/AdvancedReportsPage'
import { StockManagementPage } from '@/pages/StockManagementPage'
import { SupplierManagementPage } from '@/pages/SupplierManagementPage'
import { FinancialManagementPage } from '@/pages/FinancialManagementPage'
import HRManagementPage from '@/pages/HRManagementPage'
import { AuditLogsPage } from '@/pages/AuditLogsPage'
import { UserSettingsPage } from '@/pages/UserSettingsPage'
import { DebugPage } from '@/pages/DebugPage'
import { TestSetupPage } from '@/pages/TestSetupPage'
import { SimpleTestPage } from '@/pages/SimpleTestPage'

/**
 * AppContent - Main app content that requires AuthProvider context
 */
function AppContent() {
  const { initialized } = useAppInitialization()

  // Show loading state while initializing
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Initializing ERP System</h1>
          <p className="text-gray-600 dark:text-gray-400">Setting up enterprise features...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* PWA Components */}
      <OfflineBanner />
      <PWAUpdateNotification />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/test-setup" element={<TestSetupPage />} />
        <Route path="/simple-test" element={<SimpleTestPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales-management"
          element={
            <ProtectedRoute>
              <OrdersManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports-advanced"
          element={
            <ProtectedRoute>
              <AdvancedReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <StockManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <SupplierManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <FinancialManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr"
          element={
            <ProtectedRoute>
              <HRManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <UserSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      <GitHubButton />
    </>
  )
}

/**
 * App - Root component
 */
function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ConfirmDialogProvider>
            <AppContent />
          </ConfirmDialogProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
