import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react'
import { Button, Badge } from '@/components/ui/common'
import { FormInput } from '@/components/forms/FormFields'
import { Modal } from '@/components/ui/Modal'
import {
  generateTOTPSecret,
  generateBackupCodes,
  verifyTOTPToken,
  TwoFASession,
} from '@/lib/twoFAManager'

interface TwoFASetupModalProps {
  isOpen: boolean
  onClose: () => void
  onEnable: (secret: string, backupCodes: string[]) => void
  userId: string
}

export function TwoFASetupModal({
  isOpen,
  onClose,
  onEnable,
  userId,
}: TwoFASetupModalProps) {
  const [step, setStep] = useState<'scanner' | 'verify' | 'backup'>(
    'scanner'
  )
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState<React.ReactNode>(null)
  const [manualEntryVisible, setManualEntryVisible] = useState(false)
  const [token, setToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen && step === 'scanner') {
      const { secret: newSecret, qrCode: newQrCode } =
        generateTOTPSecret(userId)
      setSecret(newSecret)
      setQrCode(newQrCode)
      setBackupCodes(generateBackupCodes(10))
    }
  }, [isOpen, userId])

  const handleVerify = async () => {
    setLoading(true)
    setError('')

    try {
      const isValid = verifyTOTPToken(secret, token)
      if (!isValid) {
        setError('Token inválido. Por favor, tente novamente.')
        setLoading(false)
        return
      }

      setStep('backup')
    } catch (err) {
      setError('Erro ao verificar o token.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = () => {
    onEnable(secret, backupCodes)
    handleClose()
  }

  const handleClose = () => {
    setStep('scanner')
    setSecret('')
    setQrCode(null)
    setManualEntryVisible(false)
    setToken('')
    setBackupCodes([])
    setCopiedIndex(null)
    setError('')
    onClose()
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Configurar Autenticação de Dois Fatores"
      size="lg"
    >
      <div className="space-y-6">
        {/* Scanner Step */}
        {step === 'scanner' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Escaneie o código QR com seu aplicativo de autenticação (Google
                Authenticator, Microsoft Authenticator, Authy, etc.)
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                {qrCode}
              </div>
            </div>

            <button
              onClick={() => setManualEntryVisible(!manualEntryVisible)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
            >
              {manualEntryVisible ? 'Ocultar' : 'Inserir manualmente'}
            </button>

            {manualEntryVisible && (
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                  Chave secreta:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-slate-700 px-3 py-2 rounded font-mono text-sm break-all">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret, -1)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setToken('')
                  setStep('verify')
                }}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Insira o código de 6 dígitos do seu aplicativo de autenticação
                  para confirmar a configuração
                </p>
              </div>
            </div>

            <FormInput
              label="Código de Verificação"
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              placeholder="000000"
              maxLength={6}
              error={error}
              autoComplete="off"
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setToken('')
                  setStep('scanner')
                }}
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={handleVerify}
                isLoading={loading}
                disabled={token.length !== 6}
              >
                Verificar
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-300">
                  <p className="font-semibold mb-1">
                    2FA ativado com sucesso!
                  </p>
                  <p>
                    Salve os códigos de backup abaixo em um local seguro. Você
                    pode usá-los para acessar sua conta se perder o acesso ao
                    seu dispositivo autenticador.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Códigos de Recuperação
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyToClipboard(code, idx)}
                    className="relative bg-white dark:bg-slate-700 px-3 py-2 rounded font-mono text-sm border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <span className="text-gray-700 dark:text-slate-300">
                      {code}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-700/90 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedIndex === idx ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-3">
                💡 Clique em cada código para copiar
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setStep('verify')}>
                Voltar
              </Button>
              <Button variant="primary" onClick={handleEnable}>
                Concluir Configuração
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

interface TwoFAVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (token: string) => void
  onUseBackup: (code: string) => void
}

export function TwoFAVerificationModal({
  isOpen,
  onClose,
  onVerify,
  onUseBackup,
}: TwoFAVerificationModalProps) {
  const [token, setToken] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    if (useBackup) {
      onUseBackup(token)
    } else {
      if (token.length !== 6) {
        setError('Código deve ter 6 dígitos')
        setLoading(false)
        return
      }
      onVerify(token)
    }

    setToken('')
    setLoading(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setToken('')
        setUseBackup(false)
        setError('')
      }}
      title={useBackup ? 'Usar Código de Recuperação' : 'Verificação de Dois Fatores'}
      size="sm"
    >
      <div className="space-y-4">
        <FormInput
          label={useBackup ? 'Código de Recuperação' : 'Código Autenticador'}
          type="text"
          value={token}
          onChange={(e) => {
            setToken(useBackup ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          placeholder={useBackup ? 'XXXXXXXX' : '000000'}
          maxLength={useBackup ? 8 : 6}
          error={error}
          autoComplete="off"
          autoFocus
        />

        <button
          onClick={() => {
            setUseBackup(!useBackup)
            setToken('')
            setError('')
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {useBackup ? 'Usar código autenticador' : 'Usar código de recuperação'}
        </button>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              onClose()
              setToken('')
              setUseBackup(false)
              setError('')
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={
              token.length === 0 || (!useBackup && token.length !== 6)
            }
          >
            Verificar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
