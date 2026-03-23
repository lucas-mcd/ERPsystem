import React, { useState, useEffect } from 'react'
import { Plus, Eye, Trash2, Edit2, X, AlertCircle, Users, DollarSign, TrendingUp } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { Button } from '@/components/ui/common'
import { FormSelect, FormInput, FormTextarea } from '@/components/forms/FormFields'
import { apiClient } from '@/utils/apiClient'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'

interface Employee {
  id: number
  full_name: string
  email: string
  phone?: string
  cpf: string
  position: string
  department: string
  hire_date: string
  salary: number
  contract_type: string
  status: string
  is_active: boolean
}

interface Payroll {
  id: number
  employee_id: number
  month: string
  base_salary: number
  bonus: number
  gross_salary: number
  net_salary: number
  deductions: number
  status: string
  paid_date?: string
}

interface PayrollAnalytics {
  month: string
  total_employees: number
  total_gross: number
  total_deductions: number
  total_net: number
  average_salary: number
  processed_count: number
  paid_count: number
}

interface EmployeeFormData {
  full_name: string
  email: string
  phone: string
  cpf: string
  position: string
  department: string
  hire_date: string
  salary: number
  contract_type: string
}

const defaultFormData: EmployeeFormData = {
  full_name: '',
  email: '',
  phone: '',
  cpf: '',
  position: '',
  department: 'RH',
  hire_date: new Date().toISOString().slice(0, 10),
  salary: 0,
  contract_type: 'CLT',
}

export function HRManagementPage() {
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()

  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'analytics'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [analytics, setAnalytics] = useState<PayrollAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [formData, setFormData] = useState<EmployeeFormData>(defaultFormData)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [payrollFormData, setPayrollFormData] = useState<any>({
    employee_id: 0,
    month: new Date().toISOString().slice(0, 7),
    base_salary: 0,
    bonus: 0,
    inss_contribution: 0,
    irpf: 0,
    vale_transporte: 0,
    vale_alimentacao: 0,
    other_deductions: 0,
    notes: '',
  })

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiClient.get('/api/v1/hr/employees?limit=100')
      const items = (res.data as any)?.items || res.data || []
      setEmployees(Array.isArray(items) ? items : [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar funcionários')
    } finally {
      setLoading(false)
    }
  }

  // Fetch payrolls
  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiClient.get(`/api/v1/hr/payroll?month=${selectedMonth}&limit=100`)
      const items = (res.data as any)?.items || res.data || []
      setPayrolls(Array.isArray(items) ? items : [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar folhas')
    } finally {
      setLoading(false)
    }
  }

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiClient.get(`/api/v1/hr/payroll/analytics/monthly?month=${selectedMonth}`)
      setAnalytics(res.data as PayrollAnalytics)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar análise')
    } finally {
      setLoading(false)
    }
  }

  // Create/Update employee
  const handleSaveEmployee = async () => {
    if (!formData.full_name || !formData.email || !formData.cpf) {
      await alert.warning('Campos Obrigatórios', 'Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/api/v1/hr/employees/${editingId}`, formData)
      } else {
        await apiClient.post('/api/v1/hr/employees', formData)
      }
      setShowModal(false)
      setFormData(defaultFormData)
      setEditingId(null)
      fetchEmployees()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar funcionário')
    }
  }

  // Delete employee
  const handleDeleteEmployee = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Funcionário',
      message: 'Tem certeza que deseja deletar este funcionário?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/hr/employees/${id}`)
      fetchEmployees()
      await alert.success('Sucesso', 'Funcionário deletado com sucesso')
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar funcionário')
    }
  }

  // Create payroll
  const handleSavePayroll = async () => {
    if (!payrollFormData.employee_id || !payrollFormData.base_salary) {
      await alert.warning('Campos Obrigatórios', 'Por favor, selecione um funcionário e defina o salário base')
      return
    }

    try {
      await apiClient.post('/api/v1/hr/payroll', payrollFormData)
      setShowPayrollModal(false)
      setPayrollFormData({
        employee_id: 0,
        month: new Date().toISOString().slice(0, 7),
        base_salary: 0,
        bonus: 0,
        inss_contribution: 0,
        irpf: 0,
        vale_transporte: 0,
        vale_alimentacao: 0,
        other_deductions: 0,
        notes: '',
      })
      fetchPayrolls()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar folha de pagamento')
    }
  }

  // Open/close modals
  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id)
      setFormData({
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone || '',
        cpf: employee.cpf,
        position: employee.position,
        department: employee.department,
        hire_date: employee.hire_date.split('T')[0],
        salary: employee.salary,
        contract_type: employee.contract_type,
      })
    } else {
      setEditingId(null)
      setFormData(defaultFormData)
    }
    setShowModal(true)
  }

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees()
    } else if (activeTab === 'payroll') {
      fetchPayrolls()
    } else if (activeTab === 'analytics') {
      fetchAnalytics()
    }
  }, [activeTab, selectedMonth])

  return (
    <MainLayout title="RH & Folha de Pagamento">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Funcionários
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'payroll'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Folha de Pagamento
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Análise
            </div>
          </button>
        </div>

        {/* Tab: Employees */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Funcionários ({employees.length})
              </h2>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4" />
                Novo Funcionário
              </Button>
            </div>

            {/* Employee List */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum funcionário cadastrado</div>
            ) : (
              <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Cargo
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Departamento
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Salário
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{emp.full_name}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{emp.email}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{emp.position}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{emp.department}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                          R$ {emp.salary.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                              emp.is_active
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {emp.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal(emp)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Payroll */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Folha de Pagamento
                </h2>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <Button variant="secondary" onClick={() => setShowPayrollModal(true)}>
                <Plus className="w-4 h-4" />
                Nova Folha
              </Button>
            </div>

            {/* Payroll List */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : payrolls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhuma folha para este período</div>
            ) : (
              <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Funcionário
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Mês
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Bruto
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Descontos
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Líquido
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {payrolls.map((payroll) => {
                      const emp = employees.find((e) => e.id === payroll.employee_id)
                      return (
                        <tr
                          key={payroll.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {emp?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {payroll.month}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                            R$ {payroll.gross_salary.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400">
                            R$ {payroll.deductions.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                            R$ {payroll.net_salary.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                                payroll.status === 'pago'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : payroll.status === 'processado'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {payroll.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Análise Mensal
              </h2>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total de Funcionários
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {analytics.total_employees}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Folha Bruta
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">
                      R$ {(analytics.total_gross / 1000).toFixed(1)}k
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Folha Líquida
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2 font-mono">
                      R$ {(analytics.total_net / 1000).toFixed(1)}k
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Salário Médio
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">
                      R$ {(analytics.average_salary / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>

                {/* Processing Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Folhas Processadas
                      </span>
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {analytics.processed_count}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {analytics.processed_count} de {analytics.total_employees} folhas
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Folhas Pagas
                      </span>
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {analytics.paid_count}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {analytics.paid_count} de {analytics.total_employees} folhas pagas
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Detalhamento Financeiro
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Bruto:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        R$ {analytics.total_gross.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>Total Descontos:</span>
                      <span className="font-mono">
                        R$ {analytics.total_deductions.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-600 my-3"></div>
                    <div className="flex justify-between font-semibold text-lg text-green-600 dark:text-green-400">
                      <span>Total Líquido:</span>
                      <span className="font-mono">
                        R$ {analytics.total_net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado disponível para este período
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nova Folha de Pagamento
              </h3>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Funcionário"
                value={payrollFormData.employee_id}
                onChange={(e) => {
                  const employee = employees.find(e => e.id === parseInt(e.target.value))
                  setPayrollFormData({
                    ...payrollFormData,
                    employee_id: parseInt(e.target.value),
                    base_salary: employee?.salary || 0
                  })
                }}
                options={[
                  { value: '', label: 'Selecione um funcionário' },
                  ...employees.map(emp => ({
                    value: emp.id.toString(),
                    label: `${emp.full_name} - ${emp.position}`
                  }))
                ]}
              />
              <FormInput
                label="Mês"
                type="month"
                value={payrollFormData.month}
                onChange={(e) => setPayrollFormData({...payrollFormData, month: e.target.value})}
              />
              <FormInput
                label="Salário Base"
                type="number"
                value={payrollFormData.base_salary}
                onChange={(e) => setPayrollFormData({...payrollFormData, base_salary: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
              <FormInput
                label="Bônus"
                type="number"
                value={payrollFormData.bonus}
                onChange={(e) => setPayrollFormData({...payrollFormData, bonus: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
              <FormInput
                label="INSS (8%)"
                type="number"
                value={payrollFormData.inss_contribution}
                onChange={(e) => setPayrollFormData({...payrollFormData, inss_contribution: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
              <FormInput
                label="IRPF"
                type="number"
                value={payrollFormData.irpf}
                onChange={(e) => setPayrollFormData({...payrollFormData, irpf: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
              <FormInput
                label="Vale Transporte"
                type="number"
                value={payrollFormData.vale_transporte}
                onChange={(e) => setPayrollFormData({...payrollFormData, vale_transporte: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
              <FormInput
                label="Vale Alimentação"
                type="number"
                value={payrollFormData.vale_alimentacao}
                onChange={(e) => setPayrollFormData({...payrollFormData, vale_alimentacao: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>

            <FormTextarea
              label="Observações"
              value={payrollFormData.notes}
              onChange={(e) => setPayrollFormData({...payrollFormData, notes: e.target.value})}
              placeholder="Adicione notas se necessário"
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button onClick={() => setShowPayrollModal(false)} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={handleSavePayroll}>
                Criar Folha
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Nome Completo"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="João da Silva"
              />
              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="joao@empresa.com"
              />
              <FormInput
                label="CPF"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                placeholder="00000000000"
              />
              <FormInput
                label="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
              <FormInput
                label="Cargo"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Software Engineer"
              />
              <FormSelect
                label="Departamento"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                options={[
                  { value: 'RH', label: 'RH' },
                  { value: 'TI', label: 'TI' },
                  { value: 'Vendas', label: 'Vendas' },
                  { value: 'Financeiro', label: 'Financeiro' },
                  { value: 'Operacional', label: 'Operacional' },
                ]}
              />
              <FormInput
                label="Data de Contratação"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
              />
              <FormInput
                label="Salário"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
                placeholder="3000.00"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button onClick={() => setShowModal(false)} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={handleSaveEmployee}>
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default HRManagementPage

