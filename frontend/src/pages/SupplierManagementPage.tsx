import React, { useState, useEffect } from 'react'
import { Plus, Eye, Trash2, Edit2, Star, Phone, Mail, MapPin, X } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'
import { Button } from '@/components/ui/common'
import { FormSelect, FormInput, FormTextarea } from '@/components/forms/FormFields'
import { apiClient } from '@/utils/apiClient'

interface Supplier {
  id: number
  name: string
  email: string
  phone?: string
  contact_person?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country: string
  tax_id?: string
  sla_days: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  // Calculated metrics
  total_supplies: number
  avg_lead_time: number
  on_time_delivery_rate: number
  avg_defect_rate: number
  avg_unit_price: number
  performance_score: number
}

interface SupplyHistory {
  id: number
  supplier_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  expected_delivery_date?: string
  actual_delivery_date?: string
  is_on_time: boolean
  defect_count: number
  defect_rate: number
  notes?: string
  created_at: string
}

interface FormData {
  name: string
  email: string
  phone: string
  contact_person: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  tax_id: string
  sla_days: number
  notes: string
}

const defaultFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  contact_person: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Brazil',
  tax_id: '',
  sla_days: 7,
  notes: '',
}

export function SupplierManagementPage() {
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplyHistory, setSupplyHistory] = useState<SupplyHistory[]>([])
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/v1/suppliers?is_active=true&limit=500')
      const supplierList = res.data?.items || res.data || []
      setSuppliers(Array.isArray(supplierList) ? supplierList : [])
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplyHistory = async (supplierId: number) => {
    try {
      const res = await apiClient.get(`/api/v1/suppliers/${supplierId}/supply-history`)
      setSupplyHistory(res.data || [])
    } catch (err) {
      console.error('Error fetching supply history:', err)
      setSupplyHistory([])
    }
  }

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id)
      setFormData({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone || '',
        contact_person: supplier.contact_person || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        postal_code: supplier.postal_code || '',
        country: supplier.country,
        tax_id: supplier.tax_id || '',
        sla_days: supplier.sla_days || 7,
        notes: supplier.notes || '',
      })
    } else {
      setEditingId(null)
      setFormData(defaultFormData)
    }
    setShowModal(true)
  }

  // Validation Helper Functions
  const onlyNumbers = (value: string): string => {
    return value.replace(/\D/g, '')
  }

  const onlyLettersAndSpaces = (value: string): string => {
    return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = onlyNumbers(e.target.value)
    setFormData({ ...formData, phone: formattedPhone })
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPostal = onlyNumbers(e.target.value)
    // Limita a 8 dígitos
    setFormData({ ...formData, postal_code: formattedPostal.slice(0, 8) })
  }

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedTaxId = onlyNumbers(e.target.value)
    // Limita a 14 dígitos (CNPJ)
    setFormData({ ...formData, tax_id: formattedTaxId.slice(0, 14) })
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permite apenas letras, números e espaços
    const filtered = value.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, '')
    setFormData({ ...formData, name: filtered })
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permite apenas letras, números e espaços
    const filtered = value.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, '')
    setFormData({ ...formData, city: filtered })
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    // Limita a 2 caracteres para sigla de estado
    if (value.length <= 2) {
      const filtered = value.replace(/[^A-Z]/g, '')
      setFormData({ ...formData, state: filtered })
    }
  }

  const handleSaveSupplier = async () => {
    // Validações
    if (!formData.name || !formData.email) {
      await alert.warning('Campos Obrigatórios', 'Por favor, preencha o nome e email do fornecedor')
      return
    }

    if (!validateEmail(formData.email)) {
      await alert.warning('Email Inválido', 'Por favor, preencha um email válido')
      return
    }

    if (formData.phone && formData.phone.length < 10) {
      await alert.warning('Telefone Inválido', 'O telefone deve ter pelo menos 10 dígitos')
      return
    }

    if (formData.postal_code && formData.postal_code.length !== 8 && formData.postal_code.length > 0) {
      await alert.warning('CEP Inválido', 'O CEP deve ter 8 dígitos')
      return
    }

    if (formData.tax_id && formData.tax_id.length !== 14 && formData.tax_id.length !== 11 && formData.tax_id.length > 0) {
      await alert.warning('CNPJ Inválido', 'O CNPJ deve ter 14 dígitos')
      return
    }

    if (formData.sla_days < 1 || formData.sla_days > 365) {
      await alert.warning('SLA Inválido', 'O SLA deve estar entre 1 e 365 dias')
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/api/v1/suppliers/${editingId}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          contact_person: formData.contact_person || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postal_code || null,
          country: formData.country,
          tax_id: formData.tax_id || null,
          sla_days: formData.sla_days,
          notes: formData.notes || null,
        })
      } else {
        await apiClient.post('/api/v1/suppliers', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          contact_person: formData.contact_person || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postal_code || null,
          country: formData.country,
          tax_id: formData.tax_id || null,
          sla_days: formData.sla_days,
          notes: formData.notes || null,
        })
      }

      setShowModal(false)
      setFormData(defaultFormData)
      setEditingId(null)
      await fetchSuppliers()
      await alert.success('Sucesso', `Fornecedor ${editingId ? 'atualizado' : 'criado'} com sucesso!`)
    } catch (error: any) {
      console.error('Error saving supplier:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Erro ao salvar fornecedor'
      await alert.error('Erro', errorMessage)
    }
  }

  const handleDeleteSupplier = async (supplierId: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Fornecedor',
      message: 'Tem certeza que deseja deletar este fornecedor?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/suppliers/${supplierId}`)
      await fetchSuppliers()
      await alert.success('Sucesso', 'Fornecedor deletado com sucesso!')
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      await alert.error('Erro', 'Erro ao deletar fornecedor')
    }
  }

  const handleViewHistory = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    fetchSupplyHistory(supplier.id)
    setShowHistoryModal(true)
  }

  const renderMetrics = (supplier: Supplier) => {
    if (supplier.total_supplies === 0) {
      return (
        <div className="text-xs text-gray-500 italic">
          Sem histórico de fornecimento
        </div>
      )
    }
    
    return (
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Score:</span>
          <span className={`font-semibold ${supplier.performance_score >= 8 ? 'text-green-600' : supplier.performance_score >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
            {supplier.performance_score.toFixed(1)}/10
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Prazo:</span>
          <span className="text-gray-900 dark:text-white">{supplier.avg_lead_time.toFixed(0)} dias</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">No Prazo:</span>
          <span className={supplier.on_time_delivery_rate >= 80 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
            {supplier.on_time_delivery_rate.toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Defeitos:</span>
          <span className={supplier.avg_defect_rate <= 5 ? 'text-green-600 font-semibold' : 'text-red-600'}>
            {supplier.avg_defect_rate.toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }

  const renderSupplyMetrics = (history: SupplyHistory) => {
    return (
      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${history.is_on_time ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
            {history.is_on_time ? '✓ No prazo' : '✗ Atrasado'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Defeitos:</span>
          <span className={history.defect_rate === 0 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
            {history.defect_rate.toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <MainLayout title="Gestão de Fornecedores">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fornecedores</h2>
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum fornecedor cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Contato</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">SLA (dias)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Desempenho</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                          {supplier.tax_id && (
                            <p className="text-xs text-gray-500">CNPJ: {supplier.tax_id}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Mail className="w-4 h-4" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Phone className="w-4 h-4" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded">
                          {supplier.sla_days} dias
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {renderMetrics(supplier)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewHistory(supplier)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                            title="Ver histórico"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(supplier)}
                            className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition"
                            title="Editar"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                            title="Deletar"
                          >
                            <Trash2 className="w-5 h-5" />
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData(defaultFormData)
                    setEditingId(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Nome do Fornecedor"
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Ex: João Silva Fornecimentos"
                    required
                  />
                  <FormInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    placeholder="fornecedor@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormInput
                      label="Telefone"
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength="11"
                    />
                    {formData.phone && formData.phone.length < 10 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Telefone deve ter pelo menos 10 dígitos</p>
                    )}
                  </div>
                  <FormInput
                    label="Pessoa de Contato"
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Ex: Maria"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormInput
                      label="CNPJ"
                      type="text"
                      value={formData.tax_id}
                      onChange={handleTaxIdChange}
                      placeholder="12345678901234"
                      maxLength="14"
                    />
                    {formData.tax_id && formData.tax_id.length !== 14 && formData.tax_id.length > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">CNPJ deve ter 14 dígitos</p>
                    )}
                  </div>
                  <FormInput
                    label="SLA (dias acordados)"
                    type="number"
                    value={formData.sla_days.toString()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 7
                      if (value >= 1 && value <= 365) {
                        setFormData({ ...formData, sla_days: value })
                      }
                    }}
                    min="1"
                    max="365"
                  />
                </div>

                <FormInput
                  label="Endereço"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Rua das Flores, 123"
                />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FormInput
                      label="Cidade"
                      type="text"
                      value={formData.city}
                      onChange={handleCityChange}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div>
                    <FormInput
                      label="Estado"
                      type="text"
                      value={formData.state}
                      onChange={handleStateChange}
                      placeholder="SP"
                      maxLength="2"
                    />
                    {formData.state && formData.state.length !== 2 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Use 2 letras (ex: SP)</p>
                    )}
                  </div>
                  <div>
                    <FormInput
                      label="CEP"
                      type="text"
                      value={formData.postal_code}
                      onChange={handlePostalCodeChange}
                      placeholder="12345678"
                      maxLength="8"
                    />
                    {formData.postal_code && formData.postal_code.length !== 8 && formData.postal_code.length > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">CEP deve ter 8 dígitos</p>
                    )}
                  </div>
                </div>

                <FormInput
                  label="País"
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Ex: Brasil"
                />

                <FormTextarea
                  label="Observações"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Notas adicionais sobre o fornecedor"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={handleSaveSupplier} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Atualizar' : 'Criar'}
                </Button>
                <Button
                  onClick={() => {
                    setShowModal(false)
                    setFormData(defaultFormData)
                    setEditingId(null)
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Supply History Modal */}
        {showHistoryModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Histórico de Fornecimento
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedSupplier.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false)
                    setSelectedSupplier(null)
                    setSupplyHistory([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {supplyHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum histórico de fornecimento registrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Qtd</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Preço Unit.</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Prazos</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Qualidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {supplyHistory.map((history) => (
                        <tr key={history.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{history.product_name}</td>
                          <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{history.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                            R$ {history.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white font-medium">
                            R$ {history.total_amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <div className="space-y-1">
                              {history.expected_delivery_date && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  Esperado: {new Date(history.expected_delivery_date).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {history.actual_delivery_date && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  Realizado: {new Date(history.actual_delivery_date).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {renderSupplyMetrics(history)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => {
                    setShowHistoryModal(false)
                    setSelectedSupplier(null)
                    setSupplyHistory([])
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
