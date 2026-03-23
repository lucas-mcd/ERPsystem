import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'
import { Button } from '@/components/ui/common'
import { FormInput, FormSelect } from '@/components/forms/FormFields'
import { apiClient } from '@/utils/apiClient'

interface BankAccount {
  id: number
  account_name: string
  bank_name: string
  account_number: string
  branch_code: string
  account_type: string
  current_balance: number
  currency: string
  status: string
}

interface AccountsReceivable {
  id: number
  customer_id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  received_amount: number
  balance: number
  status: string
  payment_method?: string
}

interface AccountsPayable {
  id: number
  supplier_id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  paid_amount: number
  balance: number
  status: string
  payment_method?: string
}

interface CashFlow {
  id: number
  projection_date: string
  category: string
  type: string
  amount: number
  probability: number
  due_date: string
  status: string
  description?: string
}

interface FinancialSummary {
  total_receivable: number
  total_payable: number
  total_bank_balance: number
  overdue_receivable: number
  overdue_payable: number
  cash_flow_30_days: number
  net_position: number
}

export function FinancialManagementPage() {
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()

  const [activeTab, setActiveTab] = useState<'summary' | 'receivables' | 'payables' | 'bank' | 'cashflow'>(
    'summary'
  )
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([])
  const [payables, setPayables] = useState<AccountsPayable[]>([])
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showBankModal, setShowBankModal] = useState(false)
  const [showARModal, setShowARModal] = useState(false)
  const [showAPModal, setShowAPModal] = useState(false)
  const [showCFModal, setShowCFModal] = useState(false)

  const [bankFormData, setBankFormData] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_type: 'corrente',
    cpf_cnpj: '',
    initial_balance: 0,
  })

  const [arFormData, setARFormData] = useState({
    customer_id: 0,
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: '',
  })

  const [apFormData, setAPFormData] = useState({
    supplier_id: 0,
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: '',
  })

  const [cfFormData, setCFFormData] = useState({
    category: 'entrada',
    type: 'other',
    amount: 0,
    probability: 100,
    due_date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const fetchBankAccounts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/v1/accounts/bank-accounts?limit=100')
      setBankAccounts(response.data?.items || [])
    } catch (err) {
      setError('Erro ao carregar contas bancárias')
    } finally {
      setLoading(false)
    }
  }

  const fetchReceivables = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/v1/accounts/receivables?limit=100')
      setReceivables(response.data?.items || [])
    } catch (err) {
      setError('Erro ao carregar contas a receber')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayables = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/v1/accounts/payables?limit=100')
      setPayables(response.data?.items || [])
    } catch (err) {
      setError('Erro ao carregar contas a pagar')
    } finally {
      setLoading(false)
    }
  }

  const fetchCashFlows = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/v1/accounts/cash-flows?limit=100')
      setCashFlows(response.data?.items || [])
    } catch (err) {
      setError('Erro ao carregar fluxos de caixa')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get('/api/v1/accounts/summary')
      setSummary(response.data)
    } catch (err) {
      console.error('Erro ao carregar sumário:', err)
    }
  }

  useEffect(() => {
    fetchBankAccounts()
    fetchReceivables()
    fetchPayables()
    fetchCashFlows()
    fetchSummary()
  }, [])

  const handleCreateBankAccount = async () => {
    if (!bankFormData.account_name || !bankFormData.bank_name) {
      alert('Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      await apiClient.post('/api/v1/accounts/bank-accounts', bankFormData)
      setShowBankModal(false)
      setBankFormData({
        account_name: '',
        bank_name: '',
        account_number: '',
        branch_code: '',
        account_type: 'corrente',
        cpf_cnpj: '',
        initial_balance: 0,
      })
      fetchBankAccounts()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta bancária')
    }
  }

  const handleCreateAR = async () => {
    if (!arFormData.invoice_number || !arFormData.customer_id || !arFormData.amount) {
      alert('Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      await apiClient.post('/api/v1/accounts/receivables', arFormData)
      setShowARModal(false)
      setARFormData({
        customer_id: 0,
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: '',
      })
      fetchReceivables()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta a receber')
    }
  }

  const handleCreateAP = async () => {
    if (!apFormData.invoice_number || !apFormData.supplier_id || !apFormData.amount) {
      alert('Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      await apiClient.post('/api/v1/accounts/payables', apFormData)
      setShowAPModal(false)
      setAPFormData({
        supplier_id: 0,
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: '',
      })
      fetchPayables()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta a pagar')
    }
  }

  const handleCreateCashFlow = async () => {
    if (!cfFormData.amount || !cfFormData.due_date) {
      alert('Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      const payload = {
        ...cfFormData,
        projection_date: new Date().toISOString(),
      }
      await apiClient.post('/api/v1/accounts/cash-flows', payload)
      setShowCFModal(false)
      setCFFormData({
        category: 'entrada',
        type: 'other',
        amount: 0,
        probability: 100,
        due_date: new Date().toISOString().split('T')[0],
        description: '',
      })
      fetchCashFlows()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar fluxo de caixa')
    }
  }

  const handleDeleteBankAccount = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Conta Bancária',
      message: 'Tem certeza que deseja deletar esta conta?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/accounts/bank-accounts/${id}`)
      fetchBankAccounts()
      await alert.success('Sucesso', 'Conta deletada com sucesso')
    } catch (err: any) {
      setError('Erro ao deletar conta')
    }
  }

  const handleDeleteReceivable = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Conta a Receber',
      message: 'Tem certeza que deseja deletar esta conta a receber?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/accounts/receivables/${id}`)
      fetchReceivables()
      await alert.success('Sucesso', 'Conta a receber deletada com sucesso')
    } catch (err: any) {
      setError('Erro ao deletar')
    }
  }

  const handleDeletePayable = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Conta a Pagar',
      message: 'Tem certeza que deseja deletar esta conta a pagar?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/accounts/payables/${id}`)
      fetchPayables()
      await alert.success('Sucesso', 'Conta a pagar deletada com sucesso')
    } catch (err: any) {
      setError('Erro ao deletar')
    }
  }

  const handleDeleteCashFlow = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Fluxo de Caixa',
      message: 'Tem certeza que deseja deletar este fluxo de caixa?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/accounts/cash-flows/${id}`)
      fetchCashFlows()
      await alert.success('Sucesso', 'Fluxo de caixa deletado com sucesso')
    } catch (err: any) {
      setError('Erro ao deletar')
    }
  }

  return (
    <MainLayout title="Gestão Financeira">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
        {['summary', 'receivables', 'payables', 'bank', 'cashflow'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-slate-400'
            }`}
          >
            {tab === 'summary' && 'Resumo'}
            {tab === 'receivables' && 'A Receber'}
            {tab === 'payables' && 'A Pagar'}
            {tab === 'bank' && 'Contas Bancárias'}
            {tab === 'cashflow' && 'Fluxo de Caixa'}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && summary && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Total a Receber</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              R$ {(summary.total_receivable || 0).toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-red-600">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Total a Pagar</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              R$ {(summary.total_payable || 0).toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Saldo em Caixa</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              R$ {(summary.total_bank_balance || 0).toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Posição Líquida</p>
            <p className={`text-3xl font-bold ${
              (summary.net_position || 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              R$ {(summary.net_position || 0).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        </div>
      )}

      {activeTab === 'bank' && (
        <div>
          <Button onClick={() => setShowBankModal(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((account) => (
              <div key={account.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {account.account_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{account.bank_name}</p>
                  </div>
                  <button onClick={() => handleDeleteBankAccount(account.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Conta:</span>
                    <span>{account.account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Saldo:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      R$ {account.current_balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showBankModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Nova Conta Bancária</h2>
                  <button onClick={() => setShowBankModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormInput
                    label="Nome"
                    value={bankFormData.account_name}
                    onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                  />
                  <FormInput
                    label="Banco"
                    value={bankFormData.bank_name}
                    onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                  />
                  <FormInput
                    label="Conta"
                    value={bankFormData.account_number}
                    onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                  />
                  <FormInput
                    label="Saldo (R$)"
                    type="number"
                    value={bankFormData.initial_balance}
                    onChange={(e) => setBankFormData({ ...bankFormData, initial_balance: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button onClick={() => setShowBankModal(false)} variant="ghost">Cancelar</Button>
                  <Button onClick={handleCreateBankAccount}>Criar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'receivables' && (
        <div>
          <Button onClick={() => setShowARModal(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">Fatura</th>
                  <th className="px-4 py-3 text-left">Vencimento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((ar) => (
                  <tr key={ar.id} className="border-t">
                    <td className="px-4 py-3">{ar.invoice_number}</td>
                    <td className="px-4 py-3">{new Date(ar.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right">R$ {ar.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-xs rounded">
                        {ar.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteReceivable(ar.id)}>
                        <Trash2 className="w-4 h-4 text-red-600 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showARModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Nova Conta a Receber</h2>
                  <button onClick={() => setShowARModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormInput label="Fatura" value={arFormData.invoice_number} onChange={(e) => setARFormData({ ...arFormData, invoice_number: e.target.value })} />
                  <FormInput label="Cliente ID" type="number" value={arFormData.customer_id} onChange={(e) => setARFormData({ ...arFormData, customer_id: parseInt(e.target.value) })} />
                  <FormInput label="Vencimento" type="date" value={arFormData.due_date} onChange={(e) => setARFormData({ ...arFormData, due_date: e.target.value })} />
                  <FormInput label="Valor (R$)" type="number" value={arFormData.amount} onChange={(e) => setARFormData({ ...arFormData, amount: parseFloat(e.target.value) })} />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button onClick={() => setShowARModal(false)} variant="ghost">Cancelar</Button>
                  <Button onClick={handleCreateAR}>Criar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payables' && (
        <div>
          <Button onClick={() => setShowAPModal(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">Fatura</th>
                  <th className="px-4 py-3 text-left">Vencimento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((ap) => (
                  <tr key={ap.id} className="border-t">
                    <td className="px-4 py-3">{ap.invoice_number}</td>
                    <td className="px-4 py-3">{new Date(ap.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right">R$ {ap.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-xs rounded">
                        {ap.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeletePayable(ap.id)}>
                        <Trash2 className="w-4 h-4 text-red-600 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAPModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Nova Conta a Pagar</h2>
                  <button onClick={() => setShowAPModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormInput label="Fatura" value={apFormData.invoice_number} onChange={(e) => setAPFormData({ ...apFormData, invoice_number: e.target.value })} />
                  <FormInput label="Fornecedor ID" type="number" value={apFormData.supplier_id} onChange={(e) => setAPFormData({ ...apFormData, supplier_id: parseInt(e.target.value) })} />
                  <FormInput label="Vencimento" type="date" value={apFormData.due_date} onChange={(e) => setAPFormData({ ...apFormData, due_date: e.target.value })} />
                  <FormInput label="Valor (R$)" type="number" value={apFormData.amount} onChange={(e) => setAPFormData({ ...apFormData, amount: parseFloat(e.target.value) })} />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button onClick={() => setShowAPModal(false)} variant="ghost">Cancelar</Button>
                  <Button onClick={handleCreateAP}>Criar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div>
          <Button onClick={() => setShowCFModal(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Prob.</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf) => (
                  <tr key={cf.id} className="border-t">
                    <td className="px-4 py-3 capitalize">{cf.category}</td>
                    <td className="px-4 py-3">{new Date(cf.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right">R$ {cf.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{cf.probability}%</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteCashFlow(cf.id)}>
                        <Trash2 className="w-4 h-4 text-red-600 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showCFModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Nova Projeção</h2>
                  <button onClick={() => setShowCFModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormSelect label="Categoria" value={cfFormData.category} onChange={(e) => setCFFormData({ ...cfFormData, category: e.target.value })} options={[{ value: 'entrada', label: 'Entrada' }, { value: 'saída', label: 'Saída' }]} />
                  <FormInput label="Data" type="date" value={cfFormData.due_date} onChange={(e) => setCFFormData({ ...cfFormData, due_date: e.target.value })} />
                  <FormInput label="Valor (R$)" type="number" value={cfFormData.amount} onChange={(e) => setCFFormData({ ...cfFormData, amount: parseFloat(e.target.value) })} />
                  <FormInput label="Probabilidade (%)" type="number" value={cfFormData.probability} onChange={(e) => setCFFormData({ ...cfFormData, probability: parseInt(e.target.value) })} />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button onClick={() => setShowCFModal(false)} variant="ghost">Cancelar</Button>
                  <Button onClick={handleCreateCashFlow}>Criar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  )
}

export default FinancialManagementPage
