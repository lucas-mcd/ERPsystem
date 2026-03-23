import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Search, Eye, Edit2, Trash2, X } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'
import { Button, StatCard, Badge } from '@/components/ui/common'
import { FormInput, FormSelect } from '@/components/forms/FormFields'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/utils/apiClient'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
}

interface Product {
  id: number
  name: string
  price: number
  quantity?: number
}

interface Order {
  id: number
  client: string
  total_amount: number
  items_count: number
  items: OrderItem[]
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_by?: string
  created_by_email?: string
  created_at: string
}

export function OrdersManagementPage() {
  const { user: currentUser } = useAuth()
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedProductQuantity, setSelectedProductQuantity] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingQuantity, setEditingQuantity] = useState('')
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    client: '',
    status: 'pending' as const,
  })

  // Define fetchOrders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const response = await apiClient.get('/api/v1/orders?limit=500')
      
      if (response.data) {
        const orderList = response.data?.items || response.data || []
        const processedOrders = Array.isArray(orderList)
          ? orderList.map((o: any) => ({
              id: o.id,
              client: o.client_name || o.client,
              total_amount: o.total_amount,
              items_count: o.items_count,
              items: o.items || [],
              status: o.status,
              created_by: o.created_by_name || o.created_by?.full_name || 'Desconhecido',
              created_by_email: o.created_by_email || o.created_by?.email || 'Desconhecido',
              created_at: o.created_at,
            }))
          : []
        setOrders(processedOrders)
        console.log('Pedidos carregados:', processedOrders)
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  // Define fetchProducts
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const token = localStorage.getItem('token')
      
      // Buscar com limite alto para pegar todos os produtos
      const response = await fetch('/api/v1/products?limit=500', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // A API retorna {total, page, page_size, items}
        const productList = Array.isArray(data) ? data : data.items || []
        
        const processedProducts = productList.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: p.quantity || 0,
        }))
        setProducts(processedProducts)
        console.log(`Produtos carregados: ${processedProducts.length} produtos`, processedProducts)
      } else {
        console.error('Erro na resposta da API:', response.status)
        throw new Error(`API retornou status ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      // Fallback com produtos mock para demonstração
      const mockFallback: Product[] = [
        { id: 1, name: 'Laptop Dell XPS', price: 4999.99, quantity: 5 },
        { id: 2, name: 'Monitor LG 27"', price: 1299.99, quantity: 10 },
        { id: 3, name: 'Teclado Mecânico RGB', price: 349.99, quantity: 15 },
        { id: 4, name: 'Mouse Logitech MX', price: 249.99, quantity: 20 },
        { id: 5, name: 'Webcam HD 1080p', price: 199.99, quantity: 12 },
        { id: 6, name: 'Headset Gamer HyperX', price: 299.99, quantity: 8 },
        { id: 7, name: 'SSD Samsung 1TB', price: 799.99, quantity: 7 },
        { id: 8, name: 'RAM DDR4 16GB', price: 599.99, quantity: 18 },
        { id: 9, name: 'Processador Intel i7', price: 1899.99, quantity: 4 },
        { id: 10, name: 'Placa Mãe Z590', price: 899.99, quantity: 6 },
      ]
      setProducts(mockFallback)
      console.log('Usando produtos mock como fallback')
    } finally {
      setLoadingProducts(false)
    }
  }

  // Fetch orders and products from API
  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  const filteredOrders = orders.filter(
    (order) =>
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm)
  )

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const completedOrders = orders.filter((o) => o.status === 'completed').length
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length

  const handleNewOrder = () => {
    setFormData({ client: '', status: 'pending' })
    setOrderItems([])
    setSelectedProductId('')
    setSelectedProductQuantity('')
    setEditingId(null)
    setShowModal(true)
  }

  const handleEditOrder = (order: Order) => {
    setFormData({
      client: order.client,
      status: order.status,
    })
    setOrderItems([...order.items])
    setSelectedProductId('')
    setSelectedProductQuantity('')
    setEditingId(order.id)
    setShowModal(true)
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleAddItem = async () => {
    if (!selectedProductId || !selectedProductQuantity) {
      await alert.warning('Campos Obrigatórios', 'Selecione um produto e uma quantidade')
      return
    }

    const quantity = parseInt(selectedProductQuantity)
    if (quantity <= 0) {
      await alert.warning('Quantidade Inválida', 'Quantidade deve ser maior que 0')
      return
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId))
    if (!product) {
      await alert.error('Erro', 'Produto não encontrado')
      return
    }

    // Verificar estoque: quantidade solicitada não pode exceder o estoque
    if (quantity > product.quantity) {
      await alert.warning('Estoque Insuficiente', 
        `Quantidade insuficiente em estoque. Disponível: ${product.quantity} unidades`
      )
      return
    }

    // Verificar se o produto já está nos itens do pedido
    const existingItem = orderItems.find((item) => item.id === selectedProductId)
    if (existingItem) {
      const totalQuantity = existingItem.quantity + quantity
      if (totalQuantity > product.quantity) {
        await alert.warning('Estoque Insuficiente',
          `Quantidade total (${totalQuantity}) excede o estoque disponível (${product.quantity})`
        )
        return
      }
      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === selectedProductId
            ? { ...item, quantity: totalQuantity }
            : item
        )
      )
    } else {
      const newItem: OrderItem = {
        id: selectedProductId,
        product_name: product.name,
        quantity: quantity,
        price: product.price,
      }
      setOrderItems((prev) => [...prev, newItem])
    }

    setSelectedProductId('')
    setSelectedProductQuantity('')
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId))
    setEditingItemId(null)
    setEditingQuantity('')
  }

  const handleStartEditItem = (itemId: string, currentQuantity: number) => {
    setEditingItemId(itemId)
    setEditingQuantity(currentQuantity.toString())
  }

  const handleSaveItemEdit = () => {
    if (!editingQuantity || parseInt(editingQuantity) <= 0) {
      alert('Quantidade deve ser maior que 0')
      return
    }

    const newQuantity = parseInt(editingQuantity)
    const item = orderItems.find((i) => i.id === editingItemId)
    if (!item) return

    // Verificar se a nova quantidade não excede o estoque
    const product = products.find((p) => p.id === parseInt(item.id))
    if (product && newQuantity > product.quantity) {
      alert(
        `Quantidade insuficiente em estoque. Disponível: ${product.quantity} unidades`
      )
      return
    }

    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === editingItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )

    setEditingItemId(null)
    setEditingQuantity('')
  }

  const handleCancelEditItem = () => {
    setEditingItemId(null)
    setEditingQuantity('')
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateItemsCount = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const handleSaveOrder = async () => {
    if (!formData.client || formData.client.trim().length < 3) {
      await alert.warning('Cliente Inválido', 'Por favor, preencha o cliente com mínimo 3 caracteres')
      return
    }

    if (orderItems.length === 0) {
      await alert.warning('Sem Itens', 'Por favor, adicione pelo menos um item ao pedido')
      return
    }

    const totalAmount = calculateTotal()
    const itemsCount = calculateItemsCount()

    if (totalAmount <= 0) {
      await alert.warning('Valor Inválido', 'O valor total do pedido deve ser maior que R$ 0,00. Verifique os preços dos produtos.')
      return
    }

    if (itemsCount <= 0) {
      await alert.warning('Quantidade Inválida', 'A quantidade total de itens deve ser maior que 0')
      return
    }

    try {
      if (editingId) {
        // Update existing order via API
        const orderPayload = {
          client_name: formData.client,
          total_amount: totalAmount,
          items_count: itemsCount,
          status: formData.status,
          items: orderItems.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
          })),
        }
        
        console.log('📤 Atualizando pedido:', orderPayload)
        
        const response = await apiClient.put(`/api/v1/orders/${editingId}`, orderPayload)

        if (response.data) {
          setOrders((prevOrders) =>
            prevOrders.map((o) =>
              o.id === editingId
                ? {
                    ...o,
                    client: formData.client,
                    items_count: itemsCount,
                    total_amount: totalAmount,
                    items: orderItems,
                    status: formData.status,
                  }
                : o
            )
          )
        }
      } else {
        // Create new order via API
        const orderPayload = {
          client_name: formData.client,
          total_amount: totalAmount,
          items_count: itemsCount,
          status: formData.status,
          items: orderItems.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
          })),
        }
        
        console.log('📤 Enviando novo pedido:', orderPayload)
        
        const response = await apiClient.post('/api/v1/orders', orderPayload)

        if (response.data) {
          // Add the new order returned from API
          const newOrder: Order = {
            id: response.data.id,
            client: response.data.client_name || formData.client,
            items_count: itemsCount,
            total_amount: totalAmount,
            items: orderItems,
            status: response.data.status || formData.status,
            created_by: currentUser?.full_name || 'Desconhecido',
            created_by_email: currentUser?.email || 'desconhecido@example.com',
            created_at: new Date().toISOString().split('T')[0],
          }
          setOrders((prevOrders) => [newOrder, ...prevOrders])
        }
      }

      setShowModal(false)
      setFormData({ client: '', status: 'pending' })
      setOrderItems([])
      setSelectedProductId('')
      setSelectedProductQuantity('')
      setEditingId(null)
      await alert.success('Sucesso', 'Pedido salvo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Erro ao salvar pedido. Tente novamente.'
      await alert.error('Erro', errorMessage)
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Pedido',
      message: 'Tem certeza que deseja deletar este pedido?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiClient.delete(`/api/v1/orders/${orderId}`)
      // Remove do estado apenas se a API respondeu com sucesso
      setOrders((prevOrders) => prevOrders.filter((o) => o.id !== orderId))
      await alert.success('Sucesso', 'Pedido deletado com sucesso')
    } catch (error: any) {
      console.error('Erro ao deletar pedido:', error)
      await alert.error('Erro', 'Erro ao deletar pedido. Tente novamente.')
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'gray',
    processing: 'blue',
    completed: 'green',
    cancelled: 'red',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }

  return (
    <MainLayout title="Gestão de Vendas">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total de Pedidos" value={orders.length} icon={ShoppingCart} variant="blue" />
        <StatCard title="Pedidos Concluídos" value={completedOrders} variant="green" />
        <StatCard title="Pendentes" value={pendingOrders} variant="amber" />
        <StatCard
          title="Receita"
          value={`R$ ${(totalRevenue / 1000).toFixed(1)}k`}
          variant="blue"
        />
      </div>

      {/* Actions and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID do pedido..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleNewOrder}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                  Pedido #
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                  Itens
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                  Valor
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                  Status
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
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    #{order.id}
                  </td>
                  <td className="px-6 py-3 text-gray-900 dark:text-white">{order.client}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{order.items_count}</td>
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                    R$ {order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={statusColors[order.status] as any}>
                      {statusLabels[order.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Atividade Recente</h3>

        <div className="space-y-4">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Pedido #{order.id}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {order.client} • {order.items_count} itens
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Por: {order.created_by_email}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    R$ {order.total_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <Badge
                  variant={
                    order.status === 'completed'
                      ? 'green'
                      : order.status === 'processing'
                      ? 'blue'
                      : order.status === 'pending'
                      ? 'gray'
                      : 'red'
                  }
                >
                  {statusLabels[order.status]}
                </Badge>

                <button
                  onClick={() => handleViewOrder(order)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal - Create/Edit Order */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Pedido' : 'Novo Pedido'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({ client: '', status: 'pending' })
                  setOrderItems([])
                  setSelectedProductId('')
                  setSelectedProductQuantity('')
                  setEditingId(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Client and Status - Full width on mobile, 2 cols on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <FormInput
                      label="Cliente"
                      placeholder="Nome do cliente"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    />
                  </div>

                  <FormSelect
                    label="Status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'pending' | 'processing' | 'completed' | 'cancelled',
                      })
                    }
                    options={[
                      { value: 'pending', label: 'Pendente' },
                      { value: 'processing', label: 'Processando' },
                      { value: 'completed', label: 'Concluído' },
                      { value: 'cancelled', label: 'Cancelado' },
                    ]}
                  />
                </div>

                {/* Product Selection Section */}
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Adicionar Itens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="md:col-span-2 lg:col-span-2">
                      <FormSelect
                        label="Produto"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        options={products.map((p) => ({
                          value: p.id.toString(),
                          label: `${p.name} - R$ ${p.price.toFixed(2)} (Est: ${p.quantity})`,
                        }))}
                        disabled={loadingProducts || products.length === 0}
                      />
                      {products.length === 0 && !loadingProducts && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                          ⚠️ Nenhum produto disponível
                        </p>
                      )}
                      {loadingProducts && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                          ⏳ Carregando produtos...
                        </p>
                      )}
                      {selectedProductId && products.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Máximo disponível:{' '}
                          <span className="font-semibold">
                            {products.find((p) => p.id === parseInt(selectedProductId))?.quantity || 0}
                          </span>{' '}
                          unidades
                        </p>
                      )}
                    </div>

                    <FormInput
                      label="Quantidade"
                      type="number"
                      placeholder="Ex: 2"
                      value={selectedProductQuantity}
                      onChange={(e) => setSelectedProductQuantity(e.target.value)}
                      min="1"
                      max={
                        selectedProductId
                          ? products.find((p) => p.id === parseInt(selectedProductId))?.quantity.toString()
                          : undefined
                      }
                    />

                    <div className="flex items-end">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleAddItem}
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loadingProducts || products.length === 0}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Items List Table */}
                {orderItems.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-600">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Itens do Pedido</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                              Produto
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                              Preço
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                              Qtd
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                              Estoque
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                              Subtotal
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item) => {
                            const product = products.find((p) => p.id === parseInt(item.id))
                            return (
                              <tr
                                key={item.id}
                                className="border-b border-gray-200 dark:border-slate-600"
                              >
                                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                  {item.product_name}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                  R$ {item.price.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {editingItemId === item.id ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <input
                                        type="number"
                                        value={editingQuantity}
                                        onChange={(e) => setEditingQuantity(e.target.value)}
                                        min="1"
                                        max={product?.quantity}
                                        className="w-16 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-center"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-gray-900 dark:text-white">{item.quantity}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                                  {product?.quantity || 0}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                  R$ {(item.price * item.quantity).toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    {editingItemId === item.id ? (
                                      <>
                                        <button
                                          onClick={handleSaveItemEdit}
                                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                          title="Salvar"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={handleCancelEditItem}
                                          className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors"
                                          title="Cancelar"
                                        >
                                          ✕
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleStartEditItem(item.id, item.quantity)}
                                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                          title="Editar quantidade"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveItem(item.id)}
                                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                          title="Deletar"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-t border-gray-200 dark:border-slate-600">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          R$ {calculateTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total de itens: {calculateItemsCount()}
                      </div>
                    </div>
                  </div>
                )}

                {orderItems.length === 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                      ⚠️ Adicione pelo menos um item ao pedido
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex gap-3 sticky bottom-0">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setShowModal(false)
                  setFormData({ client: '', status: 'pending' })
                  setOrderItems([])
                  setSelectedProductId('')
                  setSelectedProductQuantity('')
                  setEditingId(null)
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveOrder}
                className="flex-1"
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - View Order Details */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Detalhes do Pedido
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ID Pedido
                  </label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">#{selectedOrder.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cliente
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedOrder.client}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Badge variant={statusColors[selectedOrder.status] as any}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data do Pedido
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Criado Por
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedOrder.created_by || 'Desconhecido'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      ({selectedOrder.created_by_email || 'sem email'})
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {selectedOrder.items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Itens do Pedido</h3>

                  <div className="overflow-x-auto bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                            Produto
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                            Preço
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                            Qtd
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-200 dark:border-slate-600"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                              R$ {item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Total de itens:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.items_count}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="font-bold text-gray-900 dark:text-white">Valor Total:</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        R$ {selectedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-6 py-4 sticky bottom-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowDetailsModal(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default OrdersManagementPage
