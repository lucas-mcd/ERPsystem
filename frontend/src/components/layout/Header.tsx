import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Menu, Bell, LogOut, Settings } from 'lucide-react'
import { apiClient } from '@/utils/apiClient'

interface StockAlert {
  product_id: number
  product_name: string
  current_quantity: number
  min_quantity: number
  status: string
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])

  // Fetch stock alerts on mount and every 30 seconds
  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        const res = await apiClient.get('/api/v1/stock/low-stock')
        setStockAlerts(res.data || [])
      } catch (err) {
        console.error('Error fetching stock alerts:', err)
      }
    }

    fetchStockAlerts()
    const interval = setInterval(fetchStockAlerts, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        {/* Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center - Empty for Desktop */}
        <div className="flex-1 hidden sm:block" />

        {/* Right Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Notificações de Estoque"
            >
              <Bell className="w-5 h-5" />
              {stockAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 z-50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações de Estoque
                </h4>
                {stockAlerts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {stockAlerts.map((alert) => (
                      <div
                        key={alert.product_id}
                        className={`p-3 rounded-lg border ${
                          alert.current_quantity === 0
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {alert.product_name}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            alert.current_quantity === 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          Estoque: {alert.current_quantity} / Mínimo: {alert.min_quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    ✓ Todos os produtos com estoque suficiente!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.full_name}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {user?.role}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
