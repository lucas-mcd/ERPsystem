import React, { useState } from 'react'
import { ShoppingCart, Search, Filter, MoreVertical } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { Button, StatCard, Badge } from '@/components/ui/common'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { FormInput, FormSelect, FormTextarea } from '@/components/forms/FormFields'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema } from '@/lib/validation'

interface Order {
  id: number
  clientId: number
  clientName: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  itemCount: number
  date: string
}

// Mock data
const mockOrders: Order[] = [
  {
    id: 1001,
    clientId: 1,
    clientName: 'Empresa A',
    status: 'completed',
    total: 5500.00,
    itemCount: 3,
    date: '2024-01-10',
  },
  {
    id: 1002,
    clientId: 2,
    clientName: 'Loja B',
    status: 'processing',
    total: 2300.00,
    itemCount: 5,
    date: '2024-01-15',
  },
  {
    id: 1003,
    clientId: 3,
    clientName: 'Distribuidora C',
    status: 'pending',
    total: 8900.00,
    itemCount: 12,
    date: '2024-01-18',
  },
  {
    id: 1004,
    clientId: 1,
    clientName: 'Empresa A',
    status: 'completed',
    total: 1200.00,
    itemCount: 2,
    date: '2024-01-20',
  },
  {
    id: 1005,
    clientId: 4,
    clientName: 'Varejista D',
    status: 'cancelled',
    total: 3400.00,
    itemCount: 7,
    date: '2024-01-22',
  },
]

type OrderFormData = {
  clientId: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | string
  notes?: string
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState(orders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: '',
      status: 'pending',
      notes: '',
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = form
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const start = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(start, start + itemsPerPage)

  // Filter orders
  React.useEffect(() => {
    let filtered = orders
    if (searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.id.toString().includes(searchTerm)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter)
    }
    setFilteredOrders(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleCreateOrder = (data: OrderFormData) => {
    if (editingId) {
      setOrders(
        orders.map((o) =>
          o.id === editingId
            ? {
                ...o,
                clientId: parseInt(data.clientId),
                clientName: `Cliente ${data.clientId}`,
                status: data.status as Order['status'],
              }
            : o
        )
      )
      setEditingId(null)
    } else {
      const newOrder: Order = {
        id: Math.max(...orders.map((o) => o.id), 0) + 1,
        clientId: parseInt(data.clientId),
        clientName: `Cliente ${data.clientId}`,
        status: data.status as Order['status'],
        total: Math.random() * 10000,
        itemCount: Math.floor(Math.random() * 10) + 1,
        date: new Date().toISOString().split('T')[0],
      }
      setOrders([...orders, newOrder])
    }
    reset()
    setShowModal(false)
  }

  const handleEdit = (order: Order) => {
    form.setValue('clientId', order.clientId.toString())
    form.setValue('status', order.status)
    setEditingId(order.id)
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    setOrders(orders.filter((o) => o.id !== id))
    setConfirmDelete(null)
  }

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], any> = {
      completed: 'green',
      processing: 'blue',
      pending: 'amber',
      cancelled: 'red',
    }
    const labels: Record<Order['status'], string> = {
      completed: 'Concluído',
      processing: 'Processando',
      pending: 'Pendente',
      cancelled: 'Cancelado',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const columns: Column<Order>[] = [
    {
      header: 'Pedido #',
      render: (order) => `#${order.id}`,
      width: '80px',
    },
    {
      header: 'Cliente',
      render: (order) => order.clientName,
    },
    {
      header: 'Status',
      render: (order) => getStatusBadge(order.status),
    },
    {
      header: 'Itens',
      render: (order) => `${order.itemCount} items`,
    },
    {
      header: 'Total',
      render: (order) => `R$ ${order.total.toFixed(2)}`,
    },
    {
      header: 'Data',
      render: (order) => new Date(order.date).toLocaleDateString('pt-BR'),
    },
  ]

  // Stats
  const completedCount = orders.filter((o) => o.status === 'completed').length
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <MainLayout title="Pedidos">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Pedidos"
          value={orders.length}
          icon={ShoppingCart}
          variant="blue"
        />
        <StatCard
          title="Concluídos"
          value={completedCount}
          variant="green"
        />
        <StatCard
          title="Pendentes"
          value={pendingCount}
          variant="amber"
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${totalRevenue.toFixed(2)}`}
          variant="cyan"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
          <div className="flex-1">
            <FormInput
              label="Buscar"
              placeholder="Número do pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full md:w-48">
            <FormSelect
              label="Status"
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'processing', label: 'Processando' },
                { value: 'completed', label: 'Concluídos' },
                { value: 'cancelled', label: 'Cancelados' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => {
            reset()
            setEditingId(null)
            setShowModal(true)
          }}>
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable<Order>
        columns={columns}
        data={paginatedOrders}
        loading={false}
        onEdit={handleEdit}
        onDelete={(order) => setConfirmDelete(order.id)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingId(null)
          reset()
        }}
        title={editingId ? 'Editar Pedido' : 'Novo Pedido'}
      >
        <form onSubmit={handleSubmit(handleCreateOrder)} className="space-y-4">
          <FormSelect
            label="Cliente"
            options={[
              { value: '1', label: 'Cliente 1' },
              { value: '2', label: 'Cliente 2' },
              { value: '3', label: 'Cliente 3' },
              { value: '4', label: 'Cliente 4' },
            ]}
            {...register('clientId')}
            error={errors.clientId?.message}
          />

          <FormSelect
            label="Status"
            options={[
              { value: 'pending', label: 'Pendente' },
              { value: 'processing', label: 'Processando' },
              { value: 'completed', label: 'Concluído' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
            {...register('status')}
            error={errors.status?.message}
          />

          <FormTextarea
            label="Notas"
            placeholder="Adicione notas ao pedido..."
            {...register('notes')}
            error={errors.notes?.message}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false)
                setEditingId(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Deletar Pedido"
        message="Tem certeza que deseja deletar este pedido? Esta ação não pode ser desfeita."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </MainLayout>
  )
}
