import { useAuth } from '@/context/AuthContext'
import { usePermission } from '@/hooks/useAuth'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Link } from 'react-router-dom'
import React from 'react'
import { MainLayout } from '@/components/layout/MainLayout2'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { isAdmin } = usePermission()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)

  const cardData = [
    {
      title: 'Clientes',
      color: '#5B9CF5',
      shadowColor: 'rgba(91, 156, 245, 0.4)',
      path: '/clients',
      description: 'Gerenciar toda base de clientes'
    },
    {
      title: 'Produtos',
      color: '#34D399',
      shadowColor: 'rgba(52, 211, 153, 0.4)',
      path: '/products',
      description: 'Controlar inventário e preços'
    },
    {
      title: 'Usuários',
      color: '#FB923C',
      shadowColor: 'rgba(251, 146, 60, 0.4)',
      path: '/users',
      description: 'Atribuir roles e permissões',
      adminOnly: true
    }
  ]

  const [cardRotate, setCardRotate] = React.useState<Record<string, { x: number; y: number }>>({})
  const [shinePosition, setShinePosition] = React.useState<Record<string, { x: number; y: number }>>({
    'Clientes': { x: 50, y: 50 },
    'Produtos': { x: 50, y: 50 },
    'Usuários': { x: 50, y: 50 },
  })
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardTitle: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = (y - centerY) / 5
    const rotateY = (centerX - x) / 5
    
    setCardRotate(prev => ({
      ...prev,
      [cardTitle]: { x: rotateX, y: rotateY }
    }))

    setShinePosition(prev => ({
      ...prev,
      [cardTitle]: { x: (x / rect.width) * 100, y: (y / rect.height) * 100 }
    }))
  }

  const handleMouseLeave = (cardTitle: string) => {
    setCardRotate(prev => ({
      ...prev,
      [cardTitle]: { x: 0, y: 0 }
    }))
    setShinePosition(prev => ({
      ...prev,
      [cardTitle]: { x: 50, y: 50 }
    }))
  }

  return (
    <MainLayout title="Dashboard">
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dashboard-container {
          animation: fadeInDown 0.6s ease-out;
        }

        .dashboard-header {
          animation: fadeInDown 0.8s ease-out 0.1s backwards;
        }

        .dashboard-cards {
          animation: fadeInUp 0.8s ease-out 0.2s backwards;
        }

        .dashboard-info {
          animation: fadeInUp 0.8s ease-out 0.3s backwards;
        }

        .card-item {
          animation: fadeInUp 0.6s ease-out backwards;
          perspective: 1200px;
        }

        .card-item:nth-child(1) {
          animation-delay: 0.3s;
        }

        .card-item:nth-child(2) {
          animation-delay: 0.4s;
        }

        .card-item:nth-child(3) {
          animation-delay: 0.5s;
        }

        .card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
        }

        .card-container {
          width: 300px;
          height: 240px;
          position: relative;
          border-radius: 20px;
          transition: all 0.7s cubic-bezier(0.23, 1, 0.320, 1);
          transform-style: preserve-3d;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
        }

        .card-container:hover {
          box-shadow: 0 20px 60px var(--shadow-color), 0 0 30px var(--shadow-color);
        }

        .card-inner {
          width: 100%;
          height: 100%;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          position: relative;
          z-index: 1;
          transition: all 0.7s ease;
          backface-visibility: hidden;
        }

        .card-title {
          font-size: 28px;
          font-weight: 800;
          color: white;
          margin: 0;
          transition: all 0.7s ease;
          transform: translateY(0);
        }

        .card-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 12px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.7s ease;
          max-width: 250px;
          line-height: 1.5;
        }

        .card-container:hover .card-description {
          opacity: 1;
          transform: translateY(0);
        }

        .card-shine {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(
            circle at var(--shine-x, 50%) var(--shine-y, 50%),
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.1) 40%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 20px;
          pointer-events: none;
          z-index: 2;
        }

        .card-container:hover .card-shine {
          opacity: 1;
        }
      `}</style>

      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '50px',
          paddingBottom: '30px',
          borderBottom: `3px solid ${colors.border}`,
        }} className="dashboard-header">
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '42px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #2196F3, #4CAF50)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Bem-vindo, {user?.full_name}!
            </h1>
            <p style={{
              margin: '10px 0 0 0',
              color: colors.textSecondary,
              fontSize: '16px',
              letterSpacing: '0.5px',
            }}>
              Papel: <span style={{
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: colors.text,
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: colors.bgSecondary,
                display: 'inline-block',
                marginLeft: '8px',
              }}>{user?.role}</span>
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #ef5350, #ec407a)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.paddingLeft = '40px'
              ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '40px'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(244, 67, 54, 0.5)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.paddingLeft = '28px'
              ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '28px'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.3)'
            }}
          >
            Sair
          </button>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '50px',
          marginBottom: '50px',
          justifyContent: 'center',
          padding: '20px',
        }} className="dashboard-cards">
          {cardData.map((card) => (
            (!card.adminOnly || isAdmin) && (
              <div key={card.title} className="card-item">
                <Link to={card.path} className="card-link">
                  <div
                    className="card-container"
                    onMouseMove={(e) => handleMouseMove(e, card.title)}
                    onMouseLeave={() => handleMouseLeave(card.title)}
                    style={{
                      background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                      transform: `rotateX(${cardRotate[card.title]?.x || 0}deg) rotateY(${cardRotate[card.title]?.y || 0}deg) translateZ(0)`,
                      '--shadow-color': card.shadowColor,
                    } as React.CSSProperties}
                  >
                    <div 
                      className="card-shine"
                      style={{
                        '--shine-x': `${shinePosition[card.title]?.x || 50}%`,
                        '--shine-y': `${shinePosition[card.title]?.y || 50}%`,
                      } as React.CSSProperties}
                    ></div>

                    <div className="card-inner" style={{ color: 'white' }}>
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-description">{card.description}</p>
                    </div>
                  </div>
                </Link>
              </div>
            )
          ))}
        </div>

        {/* Info Box */}
        <div style={{
          padding: '30px',
          backgroundColor: colors.bgSecondary,
          border: `2px solid ${colors.border}`,
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
        }} className="dashboard-info">
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #2196F3, #4CAF50, #FF9800)',
          }}></div>

          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            Informações do Sistema
          </h2>
          <ul style={{
            margin: 0,
            paddingLeft: '24px',
            color: colors.textSecondary,
            lineHeight: '1.8',
            listStyleType: 'none',
          }}>
            <li style={{ marginBottom: '12px' }}>
              <span style={{ marginRight: '8px', color: '#2196F3', fontWeight: 'bold' }}>▪</span>
              Sistema ERP completo de gerenciamento
            </li>
            <li style={{ marginBottom: '12px' }}>
              <span style={{ marginRight: '8px', color: '#4CAF50', fontWeight: 'bold' }}>▪</span>
              Perfil de acesso: <strong style={{ textTransform: 'uppercase', color: colors.text }}>{user?.role}</strong>
            </li>
            {isAdmin && (
              <li style={{ marginBottom: '12px' }}>
                <span style={{ marginRight: '8px', color: '#FF9800', fontWeight: 'bold' }}>▪</span>
                Como administrador, você tem acesso total ao sistema
              </li>
            )}
            <li>
              <span style={{ marginRight: '8px', color: '#9C27B0', fontWeight: 'bold' }}>▪</span>
              Clique nos cards para acessar cada seção
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
