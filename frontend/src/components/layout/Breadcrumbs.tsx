import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  products: 'Produtos',
  users: 'Usuários',
  orders: 'Vendas',
  reports: 'Relatórios',
  audit: 'Auditoria',
}

export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => ({
      label: breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: `/${segment}`,
    }))

  if (segments.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-6">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Início</span>
      </Link>

      {segments.map((segment, index) => (
        <React.Fragment key={segment.path}>
          <ChevronRight className="w-4 h-4" />
          {index === segments.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {segment.label}
            </span>
          ) : (
            <Link
              to={segment.path}
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {segment.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
