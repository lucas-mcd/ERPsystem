import React, { useState } from 'react'
import { User, Lock, Shield, Bell, Palette, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { useAlert } from '@/hooks/useConfirmDialog'
import { Button, Badge, StatCard } from '@/components/ui/common'
import { FormInput, FormSelect } from '@/components/forms/FormFields'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { TwoFASetupModal, TwoFAVerificationModal } from '@/components/TwoFA/TwoFAModals'
import {
  twoFAManager,
  generateBackupCodes,
  verifyTOTPToken,
  TwoFASession,
} from '@/lib/twoFAManager'
import { activityLogger } from '@/lib/activityLogger'

export function UserSettingsPage() {
  const { user, logout } = useAuth()
  const alert = useAlert()
  const { theme, themeMode, setTheme, resetToSystemTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'notifications' | 'preferences'
  >('profile')

  // Two FA States
  const [showTwoFASetup, setShowTwoFASetup] = useState(false)
  const [showTwoFADisable, setShowTwoFADisable] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.two_fa_enabled || false)
  const [remainingBackupCodes, setRemainingBackupCodes] = useState(
    user?.two_fa_backup_codes_remaining || 0
  )
  const [twoFASession, setTwoFASession] = useState<TwoFASession | null>(null)

  // Password Change
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleEnableTwoFA = (secret: string, backupCodes: string[]) => {
    // Create session
    const session = twoFAManager.createSession(user?.id.toString() || 'user')
    session.backupCodes = backupCodes
    session.secret = secret
    setTwoFASession(session)

    // In a real app, save to backend
    setTwoFAEnabled(true)
    setRemainingBackupCodes(backupCodes.length)

    // Log the event
    activityLogger.log(
      user?.id.toString() || 'user',
      user?.full_name || 'User',
      user?.email || 'user@example.com',
      '2FA_ENABLE',
      'USER',
      {
        status: 'success',
        details: {
          backupCodesCount: backupCodes.length,
        },
      }
    )

    setShowTwoFASetup(false)
  }

  const handleDisableTwoFA = () => {
    // In a real app, call API to disable 2FA
    const session = twoFAManager.getSession(user?.id.toString() || 'user')
    if (session) {
      twoFAManager.disable(user?.id.toString() || 'user')
    }

    setTwoFAEnabled(false)
    setRemainingBackupCodes(0)
    setTwoFASession(null)
    setShowTwoFADisable(false)

    // Log the event
    activityLogger.log(
      user?.id.toString() || 'user',
      user?.full_name || 'User',
      user?.email || 'user@example.com',
      '2FA_DISABLE',
      'USER',
      { status: 'success' }
    )
  }

  const handleChangePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      await alert.warning('Campos Obrigatórios', 'Preencha todos os campos')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      await alert.warning('Senhas Diferentes', 'As senhas não correspondem')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      await alert.warning('Senha Fraca', 'A nova senha deve ter pelo menos 8 caracteres')
      return
    }

    // In a real app, call API to change password
    activityLogger.log(
      user?.id.toString() || 'user',
      user?.full_name || 'User',
      user?.email || 'user@example.com',
      'PASSWORD_CHANGE',
      'USER',
      { status: 'success' }
    )

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setShowPasswordChange(false)
    await alert.success('Sucesso', 'Senha alterada com sucesso!')
  }

  if (!user) {
    return (
      <MainLayout title="Configurações">
        <div className="text-center py-12">
          <p>Carregando...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Configurações da Conta">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Autenticação de Dois Fatores"
          value={twoFAEnabled ? 'Ativado' : 'Desativado'}
          variant={twoFAEnabled ? 'green' : 'amber'}
          icon={Shield}
        />
        <StatCard
          title="Status da Conta"
          value={user.is_active ? 'Ativa' : 'Inativa'}
          variant={user.is_active ? 'green' : 'red'}
        />
        {twoFAEnabled && (
          <StatCard
            title="Códigos de Backup Restantes"
            value={remainingBackupCodes}
            variant={remainingBackupCodes > 5 ? 'green' : 'amber'}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <User className="w-5 h-5 inline mr-2" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-5 h-5 inline mr-2" />
            Segurança
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-5 h-5 inline mr-2" />
            Notificações
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-5 h-5 inline mr-2" />
            Preferências
          </button>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Nome Completo
                </label>
                <p className="text-gray-700 dark:text-slate-300">{user.full_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Email
                </label>
                <p className="text-gray-700 dark:text-slate-300">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Função
                </label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      user.role === 'admin'
                        ? 'red'
                        : user.role === 'user'
                          ? 'blue'
                          : 'gray'
                    }
                  >
                    {user.role === 'admin'
                      ? 'Administrador'
                      : user.role === 'user'
                        ? 'Usuário'
                        : 'Visualizador'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_active ? 'green' : 'red'}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Segurança da Conta
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Mantenha sua conta segura com autenticação de dois fatores e
                  alterações de senha regulares.
                </p>
              </div>

              {/* Password Change */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Alterar Senha
                </h4>
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordChange(true)}
                >
                  Alterar Senha
                </Button>
              </div>

              {/* Two FA */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Autenticação de Dois Fatores
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                      {twoFAEnabled
                        ? 'Sua conta está protegida com 2FA'
                        : 'Ative 2FA para maior segurança'}
                    </p>
                  </div>
                  <Badge variant={twoFAEnabled ? 'green' : 'amber'}>
                    {twoFAEnabled ? 'Ativado' : 'Desativado'}
                  </Badge>
                </div>

                {twoFAEnabled ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-slate-400">
                      <p>
                        Códigos de backup disponíveis:{' '}
                        <span className="font-semibold">{remainingBackupCodes}</span>
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowTwoFADisable(true)}
                    >
                      Desativar 2FA
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowTwoFASetup(true)}
                  >
                    Ativar 2FA
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-gray-900 dark:text-white">
                    Notificações de Login
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-gray-900 dark:text-white">
                    Alertas de Segurança
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-gray-900 dark:text-white">
                    Atualizações da Conta
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* Theme Selection */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Tema da Interface
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Escolha como você prefere visualizar a aplicação
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* System Theme */}
                  <button
                    onClick={() => {
                      setTheme('system')
                      activityLogger.log(
                        user?.id.toString() || 'user',
                        user?.full_name || 'User',
                        user?.email || 'user@example.com',
                        'SETTINGS_CHANGE',
                        'USER',
                        {
                          status: 'success',
                          details: { setting: 'theme', value: 'system' },
                        }
                      )
                    }}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      themeMode === 'system'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Monitor className="w-6 h-6 mb-2 text-gray-700 dark:text-slate-300" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      Automático
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Segue a preferência do SO
                    </p>
                    {themeMode === 'system' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full" />
                    )}
                  </button>

                  {/* Light Theme */}
                  <button
                    onClick={() => {
                      setTheme('light')
                      activityLogger.log(
                        user?.id.toString() || 'user',
                        user?.full_name || 'User',
                        user?.email || 'user@example.com',
                        'SETTINGS_CHANGE',
                        'USER',
                        {
                          status: 'success',
                          details: { setting: 'theme', value: 'light' },
                        }
                      )
                    }}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      themeMode === 'light'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Sun className="w-6 h-6 mb-2 text-yellow-500" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      Claro
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Branco e cores claras
                    </p>
                    {themeMode === 'light' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-500 rounded-full" />
                    )}
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => {
                      setTheme('dark')
                      activityLogger.log(
                        user?.id.toString() || 'user',
                        user?.full_name || 'User',
                        user?.email || 'user@example.com',
                        'SETTINGS_CHANGE',
                        'USER',
                        {
                          status: 'success',
                          details: { setting: 'theme', value: 'dark' },
                        }
                      )
                    }}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      themeMode === 'dark'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Moon className="w-6 h-6 mb-2 text-indigo-600 dark:text-indigo-400" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      Escuro
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Preto e tons escuros
                    </p>
                    {themeMode === 'dark' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full" />
                    )}
                  </button>
                </div>

                {themeMode === 'system' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 Tema atual: <span className="font-semibold capitalize">{theme}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Preferências Gerais
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Idioma
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                    <option>Português (Brasil)</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Formato de Data
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="font-bold text-red-900 dark:text-red-300 mb-4">
          Zona de Perigo
        </h3>
        <Button
          variant="danger"
          icon={LogOut}
          onClick={() => setShowLogoutConfirm(true)}
        >
          Sair da Conta
        </Button>
      </div>

      {/* Modals */}
      <TwoFASetupModal
        isOpen={showTwoFASetup}
        onClose={() => setShowTwoFASetup(false)}
        onEnable={handleEnableTwoFA}
        userId={user.email}
      />

      <ConfirmDialog
        isOpen={showTwoFADisable}
        title="Desativar 2FA"
        message="Tem certeza que deseja desativar a autenticação de dois fatores? Sua conta ficará menos segura."
        onConfirm={handleDisableTwoFA}
        onCancel={() => setShowTwoFADisable(false)}
      />

      <Modal
        isOpen={showPasswordChange}
        onClose={() => {
          setShowPasswordChange(false)
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          })
        }}
        title="Alterar Senha"
        size="sm"
      >
        <div className="space-y-4">
          <FormInput
            label="Senha Atual"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
            placeholder="Digite sua senha atual"
          />

          <FormInput
            label="Nova Senha"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              })
            }
            placeholder="Digite a nova senha"
          />

          <FormInput
            label="Confirmar Senha"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Confirme a nova senha"
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPasswordChange(false)
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                })
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePassword}
            >
              Alterar Senha
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sair da Conta"
        message="Tem certeza que deseja sair? Você será redirecionado para a página de login."
        onConfirm={() => {
          setShowLogoutConfirm(false)
          logout()
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </MainLayout>
  )
}
