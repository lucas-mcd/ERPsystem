import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: ('admin' | 'user' | 'viewer')[]
}

/**
 * Componente para proteger rotas
 * 
 * Redireciona para login se não autenticado
 * Verifica permissão por role se necessário
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth()

  console.log('[ProtectedRoute] State:', { loading, isAuthenticated, hasUser: !!user, userRole: user?.role })

  if (loading) {
    console.log('[ProtectedRoute] Still loading...')
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login')
    return <Navigate to="/login" />
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    console.log('[ProtectedRoute] User role not allowed, redirecting to dashboard')
    return <Navigate to="/dashboard" />
  }

  console.log('[ProtectedRoute] Access granted')
  return <>{children}</>
}

/**
 * Hook para verificar permissões
 */
export function usePermission() {
  const { user } = useAuth()

  return {
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isViewer: user?.role === 'viewer',
    hasPermission: (roles: ('admin' | 'user' | 'viewer')[]) => {
      return user ? roles.includes(user.role) : false
    },
  }
}
