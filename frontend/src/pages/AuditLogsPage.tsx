import React, { useState } from 'react'
import {
  History,
  Download,
  Filter,
  Search,
  Trash2,
  Eye,
  ChevronDown,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { useAlert } from '@/hooks/useConfirmDialog'
import { Button, StatCard, Badge } from '@/components/ui/common'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { FormInput, FormSelect } from '@/components/forms/FormFields'
import {
  activityLogger,
  AuditLog,
  AuditActionType,
  AuditResourceType,
} from '@/lib/activityLogger'

const ACTION_COLORS: Record<AuditActionType, 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'cyan'> = {
  LOGIN: 'green',
  LOGOUT: 'blue',
  CREATE: 'green',
  UPDATE: 'yellow',
  DELETE: 'red',
  EXPORT: 'blue',
  IMPORT: 'blue',
  VIEW: 'cyan',
  DOWNLOAD: 'purple',
  SETTINGS_CHANGE: 'yellow',
  '2FA_ENABLE': 'green',
  '2FA_DISABLE': 'red',
  PASSWORD_CHANGE: 'yellow',
  PERMISSION_CHANGE: 'red',
  ROLE_CHANGE: 'red',
  FAILED_LOGIN: 'red',
  UNAUTHORIZED_ACCESS: 'red',
  ERROR: 'red',
}

const ACTION_LABELS: Record<AuditActionType, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  EXPORT: 'Exportação',
  IMPORT: 'Importação',
  VIEW: 'Visualização',
  DOWNLOAD: 'Download',
  SETTINGS_CHANGE: 'Mudança de Config',
  '2FA_ENABLE': 'Ativar 2FA',
  '2FA_DISABLE': 'Desativar 2FA',
  PASSWORD_CHANGE: 'Mudar Senha',
  PERMISSION_CHANGE: 'Mudar Permissão',
  ROLE_CHANGE: 'Mudar Função',
  FAILED_LOGIN: 'Login Falho',
  UNAUTHORIZED_ACCESS: 'Acesso Não Autorizado',
  ERROR: 'Erro',
}

const STATUS_COLORS: Record<string, string> = {
  success: 'green',
  failed: 'red',
}

export function AuditLogsPage() {
  const alert = useAlert()

  const [logs, setLogs] = useState<AuditLog[]>(activityLogger.getRecentLogs())
  const [filteredLogs, setFilteredLogs] = useState(logs)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 20
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const start = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(start, start + itemsPerPage)

  // Get stats
  const stats = activityLogger.getStats()

  // Recharge logs
  const refreshLogs = () => {
    const newLogs = activityLogger.getRecentLogs()
    setLogs(newLogs)
  }

  // Filter logs
  React.useEffect(() => {
    let filtered = logs

    if (searchTerm) {
      filtered = activityLogger
        .search(searchTerm)
        .filter((log) => logs.includes(log))
    }

    if (actionFilter) {
      filtered = filtered.filter((log) => log.action === actionFilter)
    }

    if (resourceFilter) {
      filtered = filtered.filter((log) => log.resource === resourceFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((log) => log.status === statusFilter)
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [searchTerm, actionFilter, resourceFilter, statusFilter])

  const handleClearOldLogs = async () => {
    const removed = activityLogger.clearOldLogs(90)
    setShowClearConfirm(false)
    refreshLogs()
    await alert.success('Sucesso', `${removed} logs antigos foram removidos.`)
  }

  const handleDownload = (format: 'json' | 'csv') => {
    activityLogger.downloadLogs(format)
  }

  const columns: Column<AuditLog>[] = [
    {
      header: 'Data/Hora',
      render: (log) => `${log.date} ${log.time}`,
      width: '160px',
    },
    {
      header: 'Usuário',
      render: (log) => log.userName,
    },
    {
      header: 'Ação',
      render: (log) => (
        <Badge variant={ACTION_COLORS[log.action]}>
          {ACTION_LABELS[log.action]}
        </Badge>
      ),
    },
    {
      header: 'Recurso',
      render: (log) => `${log.resource}${log.resourceName ? ` (${log.resourceName})` : ''}`,
    },
    {
      header: 'Status',
      render: (log) => (
        <Badge variant={STATUS_COLORS[log.status] || 'gray'}>
          {log.status === 'success' ? 'Sucesso' : 'Falha'}
        </Badge>
      ),
    },
  ]

  return (
    <MainLayout title="Auditoria">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Eventos"
          value={stats.total}
          icon={History}
          variant="blue"
        />
        <StatCard
          title="Bem-sucedidos"
          value={stats.byStatus.success || 0}
          variant="green"
        />
        <StatCard
          title="Falhados"
          value={stats.byStatus.failed || 0}
          variant="red"
        />
        <StatCard
          title="Usuários Únicos"
          value={Object.keys(stats.byUser).length}
          variant="cyan"
        />
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FormInput
            label="Buscar"
            placeholder="Usuário, ação, recurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />

          <FormSelect
            label="Ação"
            options={[
              { value: '', label: 'Todas' },
              { value: 'LOGIN', label: 'Login' },
              { value: 'CREATE', label: 'Criação' },
              { value: 'UPDATE', label: 'Atualização' },
              { value: 'DELETE', label: 'Exclusão' },
              { value: 'EXPORT', label: 'Exportação' },
            ]}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />

          <FormSelect
            label="Recurso"
            options={[
              { value: '', label: 'Todos' },
              { value: 'USER', label: 'Usuário' },
              { value: 'CLIENT', label: 'Cliente' },
              { value: 'PRODUCT', label: 'Produto' },
              { value: 'ORDER', label: 'Pedido' },
              { value: 'REPORT', label: 'Relatório' },
            ]}
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
          />

          <FormSelect
            label="Status"
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'success', label: 'Sucesso' },
              { value: 'failed', label: 'Falha' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshLogs}
          >
            Atualizar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleDownload('json')}
          >
            Exportar JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => handleDownload('csv')}
          >
            Exportar CSV
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setShowClearConfirm(true)}
          >
            Limpar Antigos
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <DataTable<AuditLog>
        columns={columns}
        data={paginatedLogs}
        loading={false}
        onView={(log) => {
          setSelectedLog(log)
          setShowDetailModal(true)
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalhes do Evento"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  ID do Evento
                </p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                  {selectedLog.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Data/Hora
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedLog.date} {selectedLog.time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Usuário
                </p>
                <p className="text-gray-900 dark:text-white">
                  {selectedLog.userName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Email
                </p>
                <p className="text-gray-900 dark:text-white">
                  {selectedLog.userEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Ação
                </p>
                <Badge variant={ACTION_COLORS[selectedLog.action]}>
                  {ACTION_LABELS[selectedLog.action]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Recurso
                </p>
                <p className="text-gray-900 dark:text-white">
                  {selectedLog.resource}
                </p>
              </div>
              {selectedLog.resourceId && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                    ID do Recurso
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    {selectedLog.resourceId}
                  </p>
                </div>
              )}
              {selectedLog.resourceName && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                    Nome do Recurso
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedLog.resourceName}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Status
                </p>
                <Badge variant={STATUS_COLORS[selectedLog.status] || 'gray'}>
                  {selectedLog.status === 'success' ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                    Endereço IP
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    {selectedLog.ipAddress}
                  </p>
                </div>
              )}
            </div>

            {selectedLog.errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                  Mensagem de Erro
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 break-all">
                  {selectedLog.errorMessage}
                </p>
              </div>
            )}

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Detalhes Adicionais
                </p>
                <pre className="text-xs bg-white dark:bg-slate-700 p-3 rounded overflow-auto max-h-48 text-gray-900 dark:text-slate-300">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">
                User Agent
              </p>
              <p className="text-xs text-gray-900 dark:text-slate-300 break-all">
                {selectedLog.userAgent}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowDetailModal(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Limpar Logs Antigos"
        message="Tem certeza que deseja remover todos os logs com mais de 90 dias? Esta ação não pode ser desfeita."
        onConfirm={handleClearOldLogs}
        onCancel={() => setShowClearConfirm(false)}
      />
    </MainLayout>
  )
}
