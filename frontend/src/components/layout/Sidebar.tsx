import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePermission } from '@/hooks/useAuth'
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  History,
  Boxes,
  Truck,
  DollarSign,
} from 'lucide-react'

interface SidebarLink {
  path: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  submenu?: { path: string; label: string }[]
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { isAdmin } = usePermission()
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null)
  const links: SidebarLink[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: '/sales-management',
      label: 'Gestão de Vendas',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      path: '/stock',
      label: 'Gestão de Estoque',
      icon: <Boxes className="w-5 h-5" />,
    },
    {
      path: '/suppliers',
      label: 'Gestão de Fornecedores',
      icon: <Truck className="w-5 h-5" />,
    },
    {
      path: '/financial',
      label: 'Gestão de Finanças',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      path: '/hr',
      label: 'RH & Folha de Pagamento',
      icon: <Users className="w-5 h-5" />,
    },
    {
      path: '/reports',
      label: 'Relatórios',
      icon: <BarChart3 className="w-5 h-5" />,
      submenu: [
        { path: '/reports', label: 'Relatórios Básicos' },
        { path: '/reports-advanced', label: 'PDF com Gráficos' },
      ],
    },
    ...(isAdmin
      ? [
          {
            path: '/audit-logs',
            label: 'Auditoria',
            icon: <History className="w-5 h-5" />,
            adminOnly: true,
          },
        ]
      : []),
  ]

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          w-64 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col border-r border-slate-700
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ERP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg">ERP System</h1>
              <p className="text-xs text-slate-400">Professional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {links.map((link) => (
            <div key={link.path}>
              {link.submenu ? (
                <div>
                  <button
                    onClick={() =>
                      setActiveSubmenu(
                        activeSubmenu === link.path ? null : link.path
                      )
                    }
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium
                      transition-all duration-200 group
                      ${
                        [link.path, ...(link.submenu?.map((s) => s.path) || [])].includes(
                          location.pathname
                        )
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }
                    `}
                  >
                    <span className="transition-transform group-hover:scale-110">
                      {link.icon}
                    </span>
                    <span className="flex-1 text-left">{link.label}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        activeSubmenu === link.path ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {activeSubmenu === link.path && link.submenu && (
                    <div className="mt-1 ml-4 border-l-2 border-slate-600 space-y-1">
                      {link.submenu.map((sublink) => (
                        <Link
                          key={sublink.path}
                          to={sublink.path}
                          onClick={() => onClose()}
                          className={`
                            flex items-center px-4 py-2 rounded-lg text-sm font-medium
                            transition-all duration-200
                            ${
                              isActive(sublink.path)
                                ? 'text-blue-400'
                                : 'text-slate-400 hover:text-slate-200'
                            }
                          `}
                        >
                          {sublink.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={link.path}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium
                    transition-all duration-200 group
                    ${
                      isActive(link.path)
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }
                  `}
                >
                  <span className="transition-transform group-hover:scale-110">
                    {link.icon}
                  </span>
                  <span className="flex-1">{link.label}</span>
                  {isActive(link.path) && (
                    <ChevronRight className="w-4 h-4 animate-pulse" />
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
