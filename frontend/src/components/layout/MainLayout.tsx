import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePermission } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { isAdmin } = usePermission()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-blue-600">ERP System</h1>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link to="/clients" className="text-gray-700 hover:text-blue-600 font-medium">
              Clientes
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium">
              Produtos
            </Link>
            {isAdmin && (
              <Link to="/users" className="text-gray-700 hover:text-blue-600 font-medium">
                Usuários
              </Link>
            )}
            {isAdmin && (
              <Link to="/audit-logs" className="text-gray-700 hover:text-blue-600 font-medium">
                Auditoria
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 hidden sm:inline">
              {user?.full_name}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              ≡
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-gray-50 border-t border-gray-200 px-4 py-4 space-y-2">
            <Link
              to="/dashboard"
              className="block text-gray-700 hover:text-blue-600 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/clients"
              className="block text-gray-700 hover:text-blue-600 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Clientes
            </Link>
            <Link
              to="/products"
              className="block text-gray-700 hover:text-blue-600 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Produtos
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/users"
                  className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Usuários
                </Link>
                <Link
                  to="/audit-logs"
                  className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Auditoria
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <p>© 2024 ERP System. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
