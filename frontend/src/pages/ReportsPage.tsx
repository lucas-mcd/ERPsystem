import React, { useState, useEffect } from 'react'
import { FileText, Download, Filter } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { Button, StatCard } from '@/components/ui/common'
import { FormSelect, FormInput } from '@/components/forms/FormFields'
import { apiClient } from '@/utils/apiClient'
import {
  generatePdfReport,
  generateExcelReport,
  generateCsvReport,
} from '@/lib/reportGenerator'

interface ReportData {
  id: number
  name: string
  email: string
  phone: string
  status: string
  amount: number
  date: string
}

export function ReportsPage() {
  const [reportType, setReportType] = useState<'users' | 'clients' | 'sales' | 'products' | 'orders'>('users')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [status, setStatus] = useState('all')
  const [isExporting, setIsExporting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData[]>([])

  const columns = ['id', 'name', 'email', 'phone', 'status', 'amount', 'date']
  
  const getColumnLabels = () => {
    const labelMap: Record<string, string[]> = {
      users: ['ID', 'Nome Completo', 'Email', 'Telefone', 'Status', 'Ações', 'Data Criação'],
      clients: ['ID', 'Nome', 'Email', 'Telefone', 'Status', 'Transações', 'Data'],
      sales: ['ID', 'Usuário', 'Tipo', 'Ação', 'Status', 'Valor', 'Data'],
      products: ['ID', 'Nome', 'SKU', 'Categoria', 'Estoque', 'Preço', 'Data'],
      orders: ['ID', 'Cliente', 'Usuário', 'Criado por', 'Status', 'R$ Total', 'Data Criação'],
    }
    return labelMap[reportType] || columns
  }
  
  const columnLabels = getColumnLabels()

  // Fetch data from API
  useEffect(() => {
    setStatus('all') // Reset status when report type changes
  }, [reportType])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        let data: any[] = []
        
        console.log(`Fetching data for reportType: ${reportType}`)
        
        if (reportType === 'clients') {
          const response = await apiClient.get('/api/v1/clients')
          console.log('Clients response:', response)
          data = (response.data?.items || response.data || []).map((client: any) => ({
            id: client.id,
            name: client.name || 'N/A',
            email: client.email || 'N/A',
            phone: client.phone || 'N/A',
            status: client.is_active ? 'Ativo' : 'Inativo',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
          }))
        } else if (reportType === 'users') {
          const response = await apiClient.get('/api/v1/users')
          console.log('Users response:', response)
          data = (response.data?.items || response.data || []).map((user: any) => ({
            id: user.id,
            name: user.full_name || 'N/A',
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            status: user.is_active ? 'Ativo' : 'Inativo',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
          }))
        } else if (reportType === 'sales') {
          const response = await apiClient.get('/api/v1/audit-logs')
          console.log('Audit logs response:', response)
          data = (response.data?.items || response.data || []).map((log: any, idx: number) => ({
            id: idx + 1,
            name: log.user_name || 'Sistema',
            email: log.entity_type || 'N/A',
            phone: log.action || 'N/A',
            status: 'Processado',
            amount: 250,
            date: log.timestamp ? log.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
          }))
        } else if (reportType === 'products') {
          const response = await apiClient.get('/api/v1/products')
          console.log('Products response:', response)
          data = (response.data?.items || response.data || []).map((product: any) => ({
            id: product.id,
            name: product.name || 'N/A',
            email: product.sku || 'N/A',
            phone: product.category || 'N/A',
            status: product.quantity > 0 ? `${product.quantity} un.` : 'Sem Estoque',
            amount: product.price || 0,
            date: new Date().toISOString().split('T')[0],
          }))
        } else if (reportType === 'orders') {
          const response = await apiClient.get('/api/v1/orders')
          console.log('Orders response:', response)
          data = (response.data?.items || response.data || []).map((order: any) => ({
            id: order.id,
            name: order.client_name || 'N/A',
            email: order.created_by_email || 'N/A',
            phone: order.created_by_name || 'N/A',
            status: order.status || 'N/A',
            amount: order.total_amount || 0,
            date: order.created_at ? order.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          }))
        }
        
        console.log(`Processed data for ${reportType}:`, data)
        setReportData(data)
      } catch (err) {
        console.error('Error fetching report:', err)
        setReportData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [reportType])

  // Filter data
  const filteredData = reportData.filter((item) => {
    // Special handling for products status
    if (reportType === 'products') {
      if (status !== 'all') {
        if (status === 'Com Estoque' && item.status === 'Sem Estoque') return false
        if (status === 'Sem Estoque' && item.status !== 'Sem Estoque') return false
      }
    } else {
      if (status !== 'all' && item.status !== status) return false
    }
    
    if (dateRange.from && item.date < dateRange.from) return false
    if (dateRange.to && item.date > dateRange.to) return false
    return true
  })

  const getStatusOptions = () => {
    const statusMap: Record<string, Array<{ value: string; label: string }>> = {
      users: [
        { value: 'all', label: 'Todos' },
        { value: 'Ativo', label: 'Ativos' },
        { value: 'Inativo', label: 'Inativos' },
      ],
      clients: [
        { value: 'all', label: 'Todos' },
        { value: 'Ativo', label: 'Ativos' },
        { value: 'Inativo', label: 'Inativos' },
      ],
      sales: [
        { value: 'all', label: 'Todos' },
        { value: 'Processado', label: 'Processados' },
      ],
      products: [
        { value: 'all', label: 'Todos' },
        { value: 'Com Estoque', label: 'Com Estoque' },
        { value: 'Sem Estoque', label: 'Sem Estoque' },
      ],
      orders: [
        { value: 'all', label: 'Todos' },
        { value: 'pending', label: 'Pendentes' },
        { value: 'processing', label: 'Processando' },
        { value: 'completed', label: 'Completos' },
        { value: 'cancelled', label: 'Cancelados' },
      ],
    }
    return statusMap[reportType] || [
      { value: 'all', label: 'Todos' },
      { value: 'Ativo', label: 'Ativos' },
      { value: 'Inativo', label: 'Inativos' },
    ]
  }

  const getReportTitle = () => {
    const titles: Record<string, string> = {
      users: 'Usuários',
      clients: 'Clientes',
      sales: 'Vendas',
      products: 'Produtos',
      orders: 'Pedidos',
    }
    return titles[reportType] || 'Relatório'
  }

  const handleExportPdf = () => {
    console.log('Exporting PDF with data:', { reportType, filteredData })
    setIsExporting(true)
    setTimeout(() => {
      generatePdfReport({
        title: `Relatório de ${getReportTitle()}`,
        columnKeys: columns,
        columnLabels: columnLabels,
        data: filteredData,
        filename: `relatorio-${reportType}`,
        orientation: 'landscape',
      })
      setIsExporting(false)
    }, 500)
  }

  const handleExportExcel = () => {
    setIsExporting(true)
    setTimeout(() => {
      generateExcelReport({
        title: `Relatório de ${getReportTitle()}`,
        columnKeys: columns,
        columnLabels: columnLabels,
        data: filteredData,
        filename: `relatorio-${reportType}`,
      })
      setIsExporting(false)
    }, 500)
  }

  const handleExportCsv = () => {
    setIsExporting(true)
    setTimeout(() => {
      generateCsvReport({
        title: `Relatório de ${getReportTitle()}`,
        columnKeys: columns,
        columnLabels: columnLabels,
        data: filteredData,
        filename: `relatorio-${reportType}`,
      })
      setIsExporting(false)
    }, 500)
  }

  return (
    <MainLayout title="Relatórios">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Registros"
          value={filteredData.length}
          icon={FileText}
          variant="blue"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${filteredData
            .reduce((sum, item) => sum + item.amount, 0)
            .toFixed(2)}`}
          variant="green"
        />
        <StatCard
          title="Média por Item"
          value={`R$ ${(
            filteredData.reduce((sum, item) => sum + item.amount, 0) /
            (filteredData.length || 1)
          ).toFixed(2)}`}
          variant="amber"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Filtros de Relatório
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FormSelect
            label="Tipo de Relatório"
            options={[
              { value: 'users', label: 'Usuários' },
              { value: 'clients', label: 'Clientes' },
              { value: 'sales', label: 'Vendas' },
              { value: 'products', label: 'Produtos' },
              { value: 'orders', label: 'Pedidos' },
            ]}
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
          />

          <FormSelect
            label="Status"
            options={getStatusOptions()}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />

          <FormInput
            label="Data Inicial"
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />

          <FormInput
            label="Data Final"
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            icon={Download}
            onClick={handleExportPdf}
            isLoading={isExporting}
          >
            Exportar PDF
          </Button>
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleExportExcel}
            isLoading={isExporting}
          >
            Exportar Excel
          </Button>
          <Button
            variant="ghost"
            icon={Download}
            onClick={handleExportCsv}
            isLoading={isExporting}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Data Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Visualização dos Dados
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {loading ? 'Carregando...' : `${filteredData.length} de ${reportData.length} registros`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {columnLabels.map((label) => (
                  <th
                    key={label}
                    className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-300"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnLabels.length}
                    className="px-6 py-8 text-center text-gray-500 dark:text-slate-400"
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    {columns.map((col) => (
                      <td
                        key={`${item.id}-${col}`}
                        className="px-6 py-4 text-gray-900 dark:text-slate-300"
                      >
                        {col === 'amount'
                          ? `R$ ${(item[col as keyof ReportData] as number).toFixed(2)}`
                          : String(item[col as keyof ReportData] || '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
          💡 Dicas de Uso
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>✅ Use os filtros para gerar relatórios específicos</li>
          <li>✅ Exporte em PDF para impressão profissional</li>
          <li>✅ Exporte em Excel para análise adicional</li>
          <li>✅ Use CSV para integração com outros sistemas</li>
          <li>✅ Os relatórios incluem cabeçalho com data de geração</li>
        </ul>
      </div>
    </MainLayout>
  )
}
