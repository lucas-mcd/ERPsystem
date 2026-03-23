import React, { useState, useEffect } from 'react'
import { FileDown, Calendar, BarChart3, TrendingUp } from 'lucide-react'
import { useAlert } from '@/hooks/useConfirmDialog'
import { Button } from '@/components/ui/common'
import { MainLayout } from '@/components/layout/MainLayout2'
import { apiClient } from '@/utils/apiClient'

interface ChartDatasets {
  [key: string]: any
}

interface DynamicChartProps {
  title: string
  type: 'bar' | 'pie' | 'line'
  data: ChartDatasets
}

/**
 * Dynamic Chart Component powered by Chart.js
 */
function DynamicChart({ title, type, data }: DynamicChartProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = React.useRef<any>(null)

  useEffect(() => {
    const loadChart = async () => {
      if (!canvasRef.current) return

      try {
        // Dynamically import Chart.js
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)

        // Destroy existing chart if any
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

        let chartConfig: any = {
          type,
          data: {
            labels: data.labels || [],
            datasets: [
              {
                label: data.label || 'Data',
                data: data.data || [],
                backgroundColor:
                  type === 'pie' || type === 'doughnut'
                    ? (data.colors || colors)
                    : colors[0],
                borderColor: '#fff',
                borderWidth: 2,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: type === 'pie' ? 'right' : 'bottom',
                labels: {
                  font: { size: 12 },
                  padding: 15,
                  usePointStyle: true,
                },
              },
              title: {
                display: false,
              },
            },
            scales:
              type === 'pie'
                ? {}
                : {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value: any) =>
                          type === 'line' && value > 1000
                            ? `$ ${(value / 1000).toFixed(1)}k`
                            : value,
                      },
                    },
                  },
          },
        }

        chartInstanceRef.current = new Chart(ctx, chartConfig)
      } catch (err) {
        console.error('Error loading chart:', err)
      }
    }

    loadChart()

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data, type])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      {!data?.labels || !data?.data || data.data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400">
          <p>Sem dados disponíveis para este gráfico</p>
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  )
}

/**
 * Advanced Reports Page
 */
export function AdvancedReportsPage() {
  const alert = useAlert()

  const [reportType, setReportType] = useState<'clients' | 'products' | 'orders' | 'financial'>(
    'orders'
  )
  const [days, setDays] = useState(30)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      try {
        console.log(`Fetching chart data for type: ${reportType}, days: ${days}`)
        const response = await apiClient.get(
          `/api/v1/reports/charts/${reportType}?days=${days}`
        )
        console.log(`Chart data received:`, response.data)
        setChartData(response.data)
      } catch (err) {
        console.error('Error fetching chart data:', err)
        setChartData(null)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchChartData, 500) // Debounce
    return () => clearTimeout(timer)
  }, [reportType, days])

  // Download PDF
  const downloadPDF = async (type: string) => {
    try {
      // Get auth token
      const token = localStorage.getItem('token')
      if (!token) {
        await alert.error('Não Autenticado', 'Você não está autenticado para baixar relatórios')
        return
      }

      // Use fetch directly for PDF download (apiClient doesn't handle Blob well)
      const response = await fetch(`http://localhost:8000/api/v1/reports/${type}/pdf?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio_${type}_${new Date().getTime()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      await alert.error('Erro', `Erro ao baixar relatório: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    }
  }

  return (
    <MainLayout title="Relatórios Avançados">
      <div className="space-y-8">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Gerar Relatórios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="clients">Clientes</option>
                <option value="products">Produtos</option>
                <option value="orders">Pedidos</option>
                <option value="financial">Financeiro</option>
              </select>
            </div>

            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período (dias)
              </label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={365}>Último ano</option>
              </select>
            </div>

            {/* Download PDFs */}
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => downloadPDF(reportType)}
                className="w-full flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : chartData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Chart */}
            {reportType === 'clients' && (
              <>
                <DynamicChart
                  title="Distribuição por Status"
                  type="pie"
                  data={{
                    labels: chartData.status_distribution?.labels,
                    data: chartData.status_distribution?.data,
                    colors: chartData.status_distribution?.colors,
                  }}
                />
                <DynamicChart
                  title="Clientes por Cidade"
                  type="bar"
                  data={{
                    labels: chartData.cities_distribution?.labels,
                    data: chartData.cities_distribution?.data,
                    label: 'Quantidade',
                  }}
                />
              </>
            )}

            {reportType === 'products' && (
              <>
                <DynamicChart
                  title="Status de Estoque"
                  type="pie"
                  data={{
                    labels: chartData.stock_status?.labels,
                    data: chartData.stock_status?.data,
                    colors: chartData.stock_status?.colors,
                  }}
                />
                <DynamicChart
                  title="Produtos com Maior Valor em Estoque"
                  type="bar"
                  data={{
                    labels: chartData.top_products?.labels,
                    data: chartData.top_products?.data,
                    label: 'Valor',
                  }}
                />
              </>
            )}

            {reportType === 'orders' && (
              <>
                <DynamicChart
                  title="Tendência de Receita"
                  type="line"
                  data={{
                    labels: chartData.revenue_trend?.labels,
                    data: chartData.revenue_trend?.data,
                    label: 'Receita (R$)',
                  }}
                />
                <DynamicChart
                  title="Distribuição por Status"
                  type="pie"
                  data={{
                    labels: chartData.status_distribution?.labels,
                    data: chartData.status_distribution?.data,
                    colors: chartData.status_distribution?.colors,
                  }}
                />
              </>
            )}

            {reportType === 'financial' && (
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-sm opacity-90">Receita Total</p>
                    <p className="text-2xl font-bold">
                      R$ {(chartData.total_revenue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <BarChart3 className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-sm opacity-90">Total de Pedidos</p>
                    <p className="text-2xl font-bold">{chartData.total_orders || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-sm opacity-90">Ticket Médio</p>
                    <p className="text-2xl font-bold">
                      R$ {(chartData.average_order_value || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <BarChart3 className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-sm opacity-90">Itens Vendidos</p>
                    <p className="text-2xl font-bold">{chartData.total_items_sold || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Quick Report Access */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Downloads Rápidos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'clients', label: 'Relatório de Clientes', icon: '👥' },
              { type: 'products', label: 'Relatório de Produtos', icon: '📦' },
              { type: 'orders', label: 'Relatório de Pedidos', icon: '📋' },
              { type: 'financial', label: 'Relatório Financeiro', icon: '💰' },
            ].map((report) => (
              <div
                key={report.type}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => downloadPDF(report.type)}
              >
                <p className="text-3xl mb-2">{report.icon}</p>
                <p className="font-medium text-gray-900 dark:text-white mb-2">
                  {report.label}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Baixar PDF
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default AdvancedReportsPage
