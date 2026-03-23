import React, { useState, useEffect } from 'react'
import { Plus, AlertCircle, TrendingDown, Package, Eye, X } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { useAlert } from '@/hooks/useConfirmDialog'
import { Button } from '@/components/ui/common'
import { FormSelect, FormInput } from '@/components/forms/FormFields'
import { apiClient } from '@/utils/apiClient'

interface StockMovement {
  id: number
  product_id: number
  movement_type: string
  quantity: number
  reason: string
  notes?: string
  current_quantity: number
  order_id?: number | null
  product_name?: string
  product_price?: number
  created_by_id: number
  created_at: string
}

interface StockSummary {
  product_id: number
  product_name: string
  current_quantity: number
  min_quantity: number
  status: string
  alerts_active: boolean
}

interface InventorySummary {
  total_products: number
  total_quantity: number
  products_low_stock: number
  products_out_of_stock: number
  total_value: number
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  client_name: string
  total_amount: number
  items_count: number
  items: OrderItem[]
  status: string
}

interface Supplier {
  id: number
  name: string
  email: string
}

export function StockManagementPage() {
  const alert = useAlert()

  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<StockSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [showExitMovementModal, setShowExitMovementModal] = useState(false)
  const [showEntryMovementModal, setShowEntryMovementModal] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([])
  const [showLowStockAlert, setShowLowStockAlert] = useState(true)
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(true)
  const [exitType, setExitType] = useState<'produto' | 'pedido'>('produto') // Toggle entre produto e pedido
  
  const [formData, setFormData] = useState({
    order_id: '',
    client: '',
    product_id: '',
    movement_type: 'saída',
    quantity: '',
    reason: 'venda',
    notes: '',
  })

  const [financialEntryData, setFinancialEntryData] = useState({
    product_name: '',
    supplier_id: '',
    quantity: '',
    cost_price: '',
    sale_price: '',
    transportation_cost: '0',
    icms_rate: '0',
    ipi_rate: '0',
    cofins_rate: '0',
    pis_rate: '0',
    other_taxes: '0',
    currency: 'BRL',
    notes: '',
  })

  // Fetch data on mount
  useEffect(() => {
    fetchData()
    fetchProducts()
    fetchSuppliers()
    fetchPendingOrders()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch inventory summary
      const summaryRes = await apiClient.get('/api/v1/stock/summary')
      setSummary(summaryRes.data)
      
      // Fetch recent movements
      const movementsRes = await apiClient.get('/api/v1/stock/movements?limit=20')
      setMovements(movementsRes.data)
      
      // Fetch low stock products
      const lowStockRes = await apiClient.get('/api/v1/stock/low-stock')
      setLowStockProducts(lowStockRes.data)
    } catch (err) {
      console.error('Error fetching stock data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/api/v1/products')
      console.log('Products response:', res)
      const productList = res.data?.items || res.data || []
      console.log('Processed products:', productList)
      setProducts(Array.isArray(productList) ? productList : [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await apiClient.get('/api/v1/suppliers?is_active=true&limit=500')
      const supplierList = res.data?.items || res.data || []
      setSuppliers(Array.isArray(supplierList) ? supplierList : [])
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setSuppliers([])
    }
  }

  const fetchPendingOrders = async () => {
    try {
      // Usar novo endpoint específico para saídas por pedido
      const res = await apiClient.get('/api/v1/stock/pending-orders-for-exit')
      const orderList = res.data || []
      setPendingOrders(Array.isArray(orderList) ? orderList : [])
      console.log('Pedidos pendentes carregados:', orderList)
    } catch (err) {
      console.error('Error fetching pending orders:', err)
      // Fallback para endpoint genérico se o novo não existir
      try {
        const fallbackRes = await apiClient.get('/api/v1/orders?status_filter=pending&limit=100')
        const orderList = fallbackRes.data?.items || fallbackRes.data || []
        setPendingOrders(Array.isArray(orderList) ? orderList : [])
      } catch (fallbackErr) {
        console.error('Error fetching fallback orders:', fallbackErr)
        setPendingOrders([])
      }
    }
  }

  const handleSelectOrder = (orderId: string) => {
    if (!orderId) {
      // Clear order-related fields
      setFormData({
        order_id: '',
        client: '',
        product_id: '',
        movement_type: 'saída',
        quantity: '',
        reason: 'venda',
        notes: '',
      })
      setSelectedOrderId(null)
      setSelectedOrderItems([])
      return
    }

    const order = pendingOrders.find(o => o.id === parseInt(orderId))
    if (order) {
      setSelectedOrderId(order.id)
      
      // Store all items from the order
      if (order.items && order.items.length > 0) {
        setSelectedOrderItems(order.items)
        
        // Calculate total quantity from all items
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
        
        setFormData({
          order_id: orderId,
          client: order.client_name,
          product_id: '',
          movement_type: 'saída',
          quantity: totalQuantity.toString(),
          reason: 'venda',
          notes: `Pedido #${order.id} - Cliente: ${order.client_name}`,
        })
      } else {
        setSelectedOrderItems([])
        setFormData(prev => ({
          ...prev,
          order_id: orderId,
          client: order.client_name,
          product_id: '',
          movement_type: 'saída',
          reason: 'venda',
          notes: `Pedido #${order.id} - Cliente: ${order.client_name}`,
        }))
      }
    }
  }

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Se um pedido foi selecionado, registra movimentação para TODOS os itens
    if (exitType === 'pedido' && selectedOrderId && selectedOrderItems.length > 0) {
      try {
        await apiClient.post(`/api/v1/stock/movement/from-order/${selectedOrderId}`)
        
        await alert.success('Sucesso', `Saída registrada com sucesso para ${selectedOrderItems.length} itens do Pedido #${selectedOrderId}!`)
        
        // Reset form and refresh data
        setFormData({
          order_id: '',
          client: '',
          product_id: '',
          movement_type: 'saída',
          quantity: '',
          reason: 'venda',
          notes: '',
        })
        setSelectedOrderItems([])
        setSelectedOrderId(null)
        setExitType('produto')
        setShowExitMovementModal(false)
        
        // Refresh stock data, product list, and pending orders (pedido deve sair da lista após ser marcado como concluído)
        await Promise.all([fetchData(), fetchProducts(), fetchPendingOrders()])
      } catch (err: any) {
        console.error('Error registering movement from order:', err)
        const errorMsg = err.response?.data?.detail || err.message || 'Erro desconhecido'
        await alert.error('Erro', `Erro ao registrar saída do pedido: ${errorMsg}`)
      }
      return
    }
    
    // Caso não tenha pedido, usa o fluxo manual de produto individual
    if (!formData.product_id || !formData.quantity) {
      await alert.warning('Campos Obrigatórios', 'Preencha todos os campos obrigatórios')
      return
    }

    try {
      // Obter informações do produto selecionado
      const selectedProduct = products.find(p => p.id === parseInt(formData.product_id))
      
      // Força movimento_type = 'saída' quando é saída
      await apiClient.post('/api/v1/stock/movement', {
        product_id: parseInt(formData.product_id),
        movement_type: 'saída',
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        notes: formData.notes,
        product_price: selectedProduct?.price || 0,
      })

      // Reset form and refresh data
      setFormData({
        order_id: '',
        client: '',
        product_id: '',
        movement_type: 'saída',
        quantity: '',
        reason: 'venda',
        notes: '',
      })
      setSelectedOrderItems([])
      setSelectedOrderId(null)
      setExitType('produto')
      setShowExitMovementModal(false)
      
      await alert.success('Sucesso', 'Saída registrada com sucesso!')
      
      // Refresh both stock data and product list to show updated quantities
      await Promise.all([fetchData(), fetchProducts()])
    } catch (err: any) {
      console.error('Error registering movement:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Erro desconhecido'
      await alert.error('Erro', `Erro ao registrar saída: ${errorMsg}`)
    }
  }

  const handleRegisterFinancialEntry = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !financialEntryData.product_name ||
      !financialEntryData.supplier_id ||
      !financialEntryData.quantity ||
      !financialEntryData.cost_price ||
      !financialEntryData.sale_price
    ) {
      await alert.warning('Campos Obrigatórios', 'Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      await apiClient.post('/api/v1/stock/entry-with-financial', {
        product_name: financialEntryData.product_name,
        supplier_id: parseInt(financialEntryData.supplier_id),
        quantity: parseInt(financialEntryData.quantity),
        cost_price: parseFloat(financialEntryData.cost_price),
        sale_price: parseFloat(financialEntryData.sale_price),
        transportation_cost: parseFloat(financialEntryData.transportation_cost) || 0,
        icms_rate: parseFloat(financialEntryData.icms_rate) || 0,
        ipi_rate: parseFloat(financialEntryData.ipi_rate) || 0,
        cofins_rate: parseFloat(financialEntryData.cofins_rate) || 0,
        pis_rate: parseFloat(financialEntryData.pis_rate) || 0,
        other_taxes: parseFloat(financialEntryData.other_taxes) || 0,
        currency: financialEntryData.currency,
        reason: 'compra',
        notes: financialEntryData.notes,
      })

      await alert.success('Sucesso', 'Entrada registrada com sucesso com todos os dados financeiros!')

      // Reset form
      setFinancialEntryData({
        product_name: '',
        supplier_id: '',
        quantity: '',
        cost_price: '',
        sale_price: '',
        transportation_cost: '0',
        icms_rate: '0',
        ipi_rate: '0',
        cofins_rate: '0',
        pis_rate: '0',
        other_taxes: '0',
        currency: 'BRL',
        notes: '',
      })
      setShowEntryMovementModal(false)

      // Refresh data
      await Promise.all([fetchData(), fetchProducts()])
    } catch (err: any) {
      console.error('Error registering financial entry:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Erro desconhecido ao registrar entrada'
      await alert.error('Erro', `Erro ao registrar entrada: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout title="Gestão de Estoque">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Produtos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {summary?.total_products || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500 opacity-60" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quantidade Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {summary?.total_quantity || 0}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-500 opacity-60" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estoque Baixo</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                  {summary?.products_low_stock || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500 opacity-60" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sem Estoque</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500">
                  {summary?.products_out_of_stock || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-60" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowExitMovementModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
            Registrar Saída
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowEntryMovementModal(true)
              fetchSuppliers()
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Registrar Entrada
          </Button>
        </div>

        {/* Low Stock and Out of Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="space-y-6">
            {/* Low Stock Alert */}
            {lowStockProducts.filter(p => p.current_quantity > 0).length > 0 && showLowStockAlert && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 relative">
                <button
                  onClick={() => setShowLowStockAlert(false)}
                  className="absolute top-4 right-4 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4 pr-8">
                  <AlertCircle className="w-5 h-5" />
                  Produtos com Estoque Baixo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockProducts
                    .filter(p => p.current_quantity > 0)
                    .map((product) => (
                      <div
                        key={product.product_id}
                        className="bg-white dark:bg-slate-800 rounded p-4 border border-yellow-200 dark:border-yellow-800"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">{product.product_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Estoque: {product.current_quantity} / Mínimo: {product.min_quantity}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Out of Stock Alert */}
            {lowStockProducts.filter(p => p.current_quantity === 0).length > 0 && showOutOfStockAlert && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 relative">
                <button
                  onClick={() => setShowOutOfStockAlert(false)}
                  className="absolute top-4 right-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-red-900 dark:text-red-200 mb-4 pr-8">
                  <AlertCircle className="w-5 h-5" />
                  Produtos Sem Estoque
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockProducts
                    .filter(p => p.current_quantity === 0)
                    .map((product) => (
                      <div
                        key={product.product_id}
                        className="bg-white dark:bg-slate-800 rounded p-4 border border-red-200 dark:border-red-800"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">{product.product_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Estoque: {product.current_quantity} / Mínimo: {product.min_quantity}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Movements */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Movimentações Recentes
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : movements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Estoque Atual
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <td className="px-6 py-3 text-gray-900 dark:text-white">
                        {products.find((p) => p.id === movement.product_id)?.name || `Produto ${movement.product_id}`}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            movement.movement_type === 'entrada'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {movement.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {movement.reason}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                        {movement.current_quantity}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setSelectedMovement(movement)}
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhuma movimentação registrada
            </p>
          )}
        </div>

        {/* Exit Movement Modal - Saída */}
        {showExitMovementModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Registrar Saída
                </h2>
                <button
                  onClick={() => {
                    setShowExitMovementModal(false)
                    setFormData({
                      order_id: '',
                      client: '',
                      product_id: '',
                      movement_type: 'saída',
                      quantity: '',
                      reason: 'venda',
                      notes: '',
                    })
                    setSelectedOrderId(null)
                    setSelectedOrderItems([])
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
              {/* Toggle entre Produtos e Pedidos */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setExitType('produto')
                    setFormData({ ...formData, order_id: '', client: '', product_id: '' })
                    setSelectedOrderId(null)
                    setSelectedOrderItems([])
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    exitType === 'produto'
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  📦 Produtos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExitType('pedido')
                    setFormData({ ...formData, product_id: '', quantity: '' })
                  }}
                  className={`px-4 py-2 font-medium transition-colors ${
                    exitType === 'pedido'
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  📋 Pedidos ({pendingOrders.length})
                </button>
              </div>

              <form onSubmit={handleRegisterMovement} className="space-y-4">
                {/* ==== OPÇÃO 1: PRODUTO ==== */}
                {exitType === 'produto' ? (
                  <>
                    {/* Produto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Produto *
                      </label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Selecione um produto...</option>
                        {products && products.length > 0 ? (
                          products.map((product: any) => (
                            <option key={product.id} value={product.id.toString()}>
                              {product.name} (Est: {product.quantity || 0})
                            </option>
                          ))
                        ) : (
                          <option disabled>Nenhum produto disponível</option>
                        )}
                      </select>
                    </div>

                    {/* Quantidade */}
                    <FormInput
                      label="Quantidade *"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      min="1"
                      required
                    />

                    {/* Motivo */}
                    <FormSelect
                      label="Motivo *"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      options={[
                        { value: 'venda', label: 'Venda' },
                        { value: 'devolução', label: 'Devolução' },
                        { value: 'ajuste', label: 'Ajuste' },
                        { value: 'danificado', label: 'Danificado' },
                        { value: 'outro', label: 'Outro' },
                      ]}
                    />

                    {/* Observações */}
                    <FormInput
                      label="Observações (opcional)"
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </>
                ) : (
                  /* ==== OPÇÃO 2: PEDIDO ==== */
                  <>
                    {/* Seleção de Pedido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecione um Pedido *
                      </label>
                      <select
                        value={selectedOrderId || ''}
                        onChange={(e) => {
                          const orderId = parseInt(e.target.value)
                          const order = pendingOrders.find(o => o.id === orderId)
                          if (order && order.items) {
                            setSelectedOrderId(orderId)
                            setSelectedOrderItems(order.items)
                            setFormData(prev => ({
                              ...prev,
                              order_id: orderId.toString(),
                              client: order.client_name,
                            }))
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Selecione um pedido...</option>
                        {pendingOrders.length > 0 ? (
                          pendingOrders.map((order) => (
                            <option key={order.id} value={order.id.toString()}>
                              Pedido #{order.id} - {order.client_name} ({order.items_count} itens)
                            </option>
                          ))
                        ) : (
                          <option disabled>Nenhum pedido pendente</option>
                        )}
                      </select>
                    </div>

                    {/* Visualizar itens do pedido */}
                    {selectedOrderItems.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                          Itens do Pedido:
                        </h3>
                        <div className="space-y-2">
                          {selectedOrderItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span className="text-blue-900 dark:text-blue-300">
                                {item.product_name}
                              </span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                Qtd: {item.quantity} | R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                          <div className="flex justify-between font-bold">
                            <span className="text-blue-900 dark:text-blue-200">Total:</span>
                            <span className="text-blue-900 dark:text-blue-200">
                              R$ {selectedOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={
                      exitType === 'produto' ? !formData.product_id || !formData.quantity : !selectedOrderId
                    }
                  >
                    Registrar Saída
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setShowExitMovementModal(false)
                      setExitType('produto')
                      setFormData({
                        order_id: '',
                        client: '',
                        product_id: '',
                        movement_type: 'saída',
                        quantity: '',
                        reason: 'venda',
                        notes: '',
                      })
                      setSelectedOrderId(null)
                      setSelectedOrderItems([])
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Movement Details Modal */}
        {selectedMovement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Detalhes da Movimentação {selectedMovement.order_id && `#Pedido ${selectedMovement.order_id}`}
              </h2>

              <div className="space-y-4">
                {/* Se for de um pedido, mostrar tabela de itens */}
                {selectedMovement.order_id ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Itens do Pedido
                    </label>
                    <div className="bg-white dark:bg-slate-700 rounded overflow-hidden border border-gray-200 dark:border-slate-600">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-slate-600">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Produto</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Preço</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Qtd</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Agrupar todos os movimentos do mesmo pedido */}
                          {movements
                            .filter(m => m.order_id === selectedMovement.order_id)
                            .map((movement) => (
                              <tr
                                key={movement.id}
                                className="border-t border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                              >
                                <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                                  {movement.product_name || movement.notes}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                                  R$ {(movement.product_price || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                                  {movement.quantity}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white font-medium">
                                  R$ {((movement.product_price || 0) * movement.quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700 dark:text-gray-300">Total de itens:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {movements
                            .filter(m => m.order_id === selectedMovement.order_id)
                            .reduce((sum, m) => sum + m.quantity, 0)} unidades
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-blue-900 dark:text-blue-200">Valor Total:</span>
                        <span className="text-blue-900 dark:text-blue-200">
                          R$ {movements
                            .filter(m => m.order_id === selectedMovement.order_id)
                            .reduce((sum, m) => sum + ((m.product_price || 0) * m.quantity), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Se não for de um pedido, exibir detalhes simples
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Produto
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {products.find((p) => p.id === selectedMovement.product_id)?.name || `Produto ${selectedMovement.product_id}`}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantidade
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1 font-medium">
                        {selectedMovement.quantity} unidades
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Preço Unitário
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1 font-medium text-lg">
                        R$ {(selectedMovement.product_price || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subtotal
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1 font-medium text-lg">
                        R$ {((selectedMovement.product_price || 0) * selectedMovement.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Summary Box */}
                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Total:</span>
                        <span className="font-bold text-blue-900 dark:text-blue-200">
                          R$ {((selectedMovement.product_price || 0) * selectedMovement.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Movimentação
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedMovement.movement_type === 'entrada'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {selectedMovement.movement_type.charAt(0).toUpperCase() + selectedMovement.movement_type.slice(1)}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Motivo
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedMovement.reason.charAt(0).toUpperCase() + selectedMovement.reason.slice(1)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estoque Atual
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 font-medium">
                    {selectedMovement.current_quantity} unidades
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {new Date(selectedMovement.created_at).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observações
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 p-3 bg-gray-50 dark:bg-slate-700 rounded">
                    {selectedMovement.notes || '(Sem observações)'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setSelectedMovement(null)}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Entry Movement Modal - Entrada */}
        {showEntryMovementModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Registrar Entrada
                </h2>
                <button
                  onClick={() => {
                    setShowEntryMovementModal(false)
                    setFinancialEntryData({
                      product_name: '',
                      supplier_id: '',
                      quantity: '',
                      cost_price: '',
                      sale_price: '',
                      transportation_cost: '0',
                      icms_rate: '0',
                      ipi_rate: '0',
                      cofins_rate: '0',
                      pis_rate: '0',
                      other_taxes: '0',
                      currency: 'BRL',
                      notes: '',
                    })
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
              <form onSubmit={handleRegisterFinancialEntry} className="space-y-6">
                {/* Seção 1: Produto e Fornecedor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Produto (Nome) *"
                    type="text"
                    placeholder="Digite o nome do novo produto..."
                    value={financialEntryData.product_name}
                    onChange={(e) => setFinancialEntryData({ ...financialEntryData, product_name: e.target.value })}
                    required
                  />

                  <FormSelect
                    label="Fornecedor *"
                    value={financialEntryData.supplier_id}
                    onChange={(e) => setFinancialEntryData({ ...financialEntryData, supplier_id: e.target.value })}
                    options={[
                      { value: '', label: 'Selecione um fornecedor...' },
                      ...suppliers.map((s) => ({
                        value: s.id.toString(),
                        label: s.name,
                      })),
                    ]}
                  />
                </div>

                {/* Seção 2: Quantidade */}
                <div>
                  <FormInput
                    label="Quantidade *"
                    type="number"
                    value={financialEntryData.quantity}
                    onChange={(e) => setFinancialEntryData({ ...financialEntryData, quantity: e.target.value })}
                    min="1"
                    required
                  />
                </div>

                {/* Seção 3: Preços */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-4">Dados de Preço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="Preço de Custo (unitário) *"
                      type="number"
                      step="0.01"
                      value={financialEntryData.cost_price}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, cost_price: e.target.value })}
                      required
                    />
                    <FormInput
                      label="Preço de Venda (unitário) *"
                      type="number"
                      step="0.01"
                      value={financialEntryData.sale_price}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, sale_price: e.target.value })}
                      required
                    />
                    <FormInput
                      label="Custo de Transporte"
                      type="number"
                      step="0.01"
                      value={financialEntryData.transportation_cost}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, transportation_cost: e.target.value })}
                    />
                  </div>
                </div>

                {/* Seção 4: Impostos */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-4">Impostos (%)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="ICMS (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialEntryData.icms_rate}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, icms_rate: e.target.value })}
                    />
                    <FormInput
                      label="IPI (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialEntryData.ipi_rate}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, ipi_rate: e.target.value })}
                    />
                    <FormInput
                      label="COFINS (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialEntryData.cofins_rate}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, cofins_rate: e.target.value })}
                    />
                    <FormInput
                      label="PIS (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialEntryData.pis_rate}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, pis_rate: e.target.value })}
                    />
                    <FormInput
                      label="Outros Impostos (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialEntryData.other_taxes}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, other_taxes: e.target.value })}
                    />
                    <FormSelect
                      label="Moeda"
                      value={financialEntryData.currency}
                      onChange={(e) => setFinancialEntryData({ ...financialEntryData, currency: e.target.value })}
                      options={[
                        { value: 'BRL', label: 'BRL (Real)' },
                        { value: 'USD', label: 'USD (Dólar)' },
                        { value: 'EUR', label: 'EUR (Euro)' },
                      ]}
                    />
                  </div>
                </div>

                {/* Seção 5: Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={financialEntryData.notes}
                    onChange={(e) => setFinancialEntryData({ ...financialEntryData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                {/* Aviso */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-300">
                    ✓ Ao registrar, será criado automaticamente um registro financeiro com cálculos de margem e lucro
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Registrando...' : 'Registrar Entrada'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setShowEntryMovementModal(false)
                      setFinancialEntryData({
                        product_name: '',
                        supplier_id: '',
                        quantity: '',
                        cost_price: '',
                        sale_price: '',
                        transportation_cost: '0',
                        icms_rate: '0',
                        ipi_rate: '0',
                        cofins_rate: '0',
                        pis_rate: '0',
                        other_taxes: '0',
                        currency: 'BRL',
                        notes: '',
                      })
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default StockManagementPage
