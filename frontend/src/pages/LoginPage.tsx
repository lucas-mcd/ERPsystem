import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { TwoFAVerificationModal } from '@/components/TwoFA/TwoFAModals'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, verify2FA, requiresTwoFA, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setLoading(true)

    try {
      await login(email, password)
      if (!requiresTwoFA) {
        navigate('/dashboard')
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (token: string) => {
    try {
      setFormError('')
      await verify2FA(token)
      navigate('/dashboard')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  if (requiresTwoFA) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a3e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}>
        <TwoFAVerificationModal
          isOpen={true}
          onClose={() => {
            // Handle cancel
          }}
          onVerify={handleVerify2FA}
          onUseBackup={handleVerify2FA}
        />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a3e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    }}>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .login-form-container {
          animation: fadeInScale 0.6s ease-out, gradientShift 8s ease infinite;
          background: linear-gradient(-45deg, rgba(91, 156, 245, 0.18), rgba(52, 211, 153, 0.18), rgba(251, 146, 60, 0.15));
          background-size: 400% 400%;
        }

        .login-input:focus {
          border-color: #2196F3 !important;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2) !important;
        }

        .test-credentials {
          display: grid;
          grid-template-columns: repeat(3, minmax(135px, 1fr));
          gap: clamp(10px, 3vw, 16px);
        }

        @media (max-width: 900px) {
          .test-credentials {
            grid-template-columns: repeat(2, minmax(130px, 1fr));
            gap: clamp(10px, 3vw, 14px);
          }
        }

        @media (max-width: 500px) {
          .test-credentials {
            grid-template-columns: 1fr;
            gap: clamp(10px, 3vw, 12px);
          }
        }

        @keyframes borderLight {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .credential-item {
          padding: clamp(12px, 3vw, 18px);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 2px solid rgba(255, 255, 255, 0.12);
          font-size: clamp(9px, 2vw, 12px);
          line-height: 1.7;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: auto;
        }

        .credential-item p:nth-child(3),
        .credential-item p:nth-child(5) {
          white-space: nowrap;
          font-size: 9px;
          word-break: keep-all;
        }

        .credential-item:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          transform: translateY(-3px);
        }
      `}</style>

      <div className="login-form-container" style={{
        maxWidth: '600px',
        width: '100%',
        borderRadius: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 'clamp(24px, 5vw, 48px) clamp(24px, 4vw, 48px)',
        color: 'rgba(243, 244, 246, 1)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: 'clamp(28px, 7vw, 36px)',
          lineHeight: '44px',
          fontWeight: '800',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #5B9CF5 0%, #34D399 50%, #FB923C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
          textShadow: '0 4px 20px rgba(91, 156, 245, 0.3)',
        }}>
          ERP System
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'rgba(156, 163, 175, 1)',
          marginBottom: '24px',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
        }}>
          Gestão Empresarial Integrada
        </p>

        {(formError || error) && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid #ef4444',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <p style={{
              color: '#fca5a5',
              fontSize: '13px',
              margin: 0,
            }}>{formError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(156, 163, 175, 1)',
              marginBottom: '8px',
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: '500',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="login-input"
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid rgba(55, 65, 81, 1)',
                padding: '10px 12px',
                backgroundColor: 'rgba(31, 41, 55, 1)',
                color: 'rgba(243, 244, 246, 1)',
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(156, 163, 175, 1)',
              marginBottom: '8px',
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: '500',
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="login-input"
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid rgba(55, 65, 81, 1)',
                padding: '10px 12px',
                backgroundColor: 'rgba(31, 41, 55, 1)',
                color: 'rgba(243, 244, 246, 1)',
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              borderRadius: '6px',
              border: 'none',
              padding: '12px',
              background: 'linear-gradient(135deg, #2196F3, #1e88e5)',
              color: 'rgba(243, 244, 246, 1)',
              fontSize: 'clamp(13px, 2.5vw, 14px)',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.6 : 1,
              marginTop: '8px',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.5)')}
            onMouseLeave={(e) => !loading && ((e.currentTarget as HTMLButtonElement).style.boxShadow = 'none')}
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(55, 65, 81, 1)',
        }}>
          <p style={{
            fontSize: 'clamp(11px, 2.5vw, 12px)',
            color: 'rgba(107, 114, 128, 1)',
            fontWeight: '700',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textAlign: 'center',
          }}>Credenciais de Teste</p>
          
          <div className="test-credentials">
            <div className="credential-item">
              <p style={{ margin: '0 0 6px 0', color: '#5B9CF5', fontWeight: '600' }}>Admin</p>
              <p style={{ margin: '0 0 4px 0', color: 'rgba(156, 163, 175, 1)' }}>Email:</p>
              <p style={{ margin: '0 0 3px 0', color: '#e0e0e0', fontFamily: 'monospace', fontWeight: '500' }}>admin@example.com</p>
              <p style={{ margin: '0 0 4px 0', color: 'rgba(156, 163, 175, 1)' }}>Senha:</p>
              <p style={{ margin: '0 0 3px 0', color: '#e0e0e0', fontFamily: 'monospace', fontWeight: '500' }}>AdminPass123</p>
            </div>
            
            <div className="credential-item">
              <p style={{ margin: '0 0 6px 0', color: '#34D399', fontWeight: '600' }}>Viewer</p>
              <p style={{ margin: '0 0 4px 0', color: 'rgba(156, 163, 175, 1)' }}>Email:</p>
              <p style={{ margin: '0 0 3px 0', color: '#e0e0e0', fontFamily: 'monospace', fontWeight: '500' }}>viewer@example.com</p>
              <p style={{ margin: '0 0 4px 0', color: 'rgba(156, 163, 175, 1)' }}>Senha:</p>
              <p style={{ margin: '0 0 3px 0', color: '#e0e0e0', fontFamily: 'monospace', fontWeight: '500' }}>ViewerPass123</p>
            </div>
            
            <div className="credential-item">
              <p style={{ margin: '0 0 6px 0', color: '#FB923C', fontWeight: '600' }}>User</p>
              <p style={{ margin: '0 0 4px 0', color: 'rgba(156, 163, 175, 1)' }}>Email:</p>
              <p style={{ margin: '0 0 3px 0', color: '#e0e0e0', fontFamily: 'monospace', fontWeight: '500' }}>user@example.com</p>
              <p style={{ margin: '0 0 4px 0', color: 'rgba(156, 163, 175, 1)' }}>Senha:</p>
              <p style={{ margin: '0 0 3px 0', color: '#e0e0e0', fontFamily: 'monospace', fontWeight: '500' }}>UserPass123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
