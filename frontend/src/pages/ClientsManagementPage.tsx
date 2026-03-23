import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users, Plus, Search, Mail, Phone, MapPin } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { FormInput, FormSelect, FormTextarea } from '@/components/forms/FormFields'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button, StatCard, Badge } from '@/components/ui/common'
import { clientSchema, ClientFormData } from '@/lib/validation'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  company?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at: string
}

export function ClientsManagementPage() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      company: 'Tech Solutions',
      address: 'Rua A, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01310-100',
      created_at: '2024-01-15',
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '11988888888',
      company: 'Digital Marketing',
      address: 'Av. B, 456',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01311-200',
      created_at: '2024-02-20',
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; client: Client | null }>({
    isOpen: false,
    client: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  })

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingId(client.id)
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        address: client.address,
        city: client.city,
        state: client.state,
        zip_code: client.zip_code,
      })
    } else {
      setEditingId(null)
      reset({
        name: '',
        email: '',
        phone: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    reset()
  }

  const onSubmit = (data: ClientFormData) => {
    if (editingId) {
      setClients(
        clients.map((c) =>
          c.id === editingId
            ? {
                ...c,
                ...data,
              }
            : c
        )
      )
    } else {
      const newClient: Client = {
        id: Math.max(...clients.map((c) => c.id), 0) + 1,
        ...data,
        created_at: new Date().toISOString(),
      }
      setClients([...clients, newClient])
    }
    handleCloseModal()
  }

  const handleDelete = async (client: Client) => {
    setDeleteConfirm({ isOpen: true, client })
  }

  const confirmDelete = () => {
    if (deleteConfirm.client) {
      setClients(clients.filter((c) => c.id !== deleteConfirm.client!.id))
      setDeleteConfirm({ isOpen: false, client: null })
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns: Column<Client>[] = [
    {
      header: 'Nome',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline">
          {row.email}
        </a>
      ),
    },
    {
      header: 'Telefone',
      accessor: 'phone',
      render: (row) => (
        <a href={`tel:${row.phone}`} className="text-blue-600 hover:underline">
          {row.phone}
        </a>
      ),
    },
    {
      header: 'Empresa',
      accessor: 'company',
      render: (row) => row.company || '-',
    },
    {
      header: 'Cidade',
      accessor: 'city',
      render: (row) => row.city || '-',
    },
  ]

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <MainLayout title="Gestão de Clientes">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Total de Clientes"
          value={clients.length}
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Novas Adições"
          value="12"
          description="Este mês"
          variant="green"
        />
      </div>

      {/* Actions and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
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
          icon={Plus}
          onClick={() => handleOpenModal()}
        >
          Novo Cliente
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <DataTable<Client>
          columns={columns}
          data={paginatedClients}
          onEdit={(client) => handleOpenModal(client)}
          onDelete={handleDelete}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Nome *"
              placeholder="João Silva"
              {...register('name')}
              error={errors.name}
            />

            <FormInput
              label="Email *"
              type="email"
              placeholder="joao@example.com"
              {...register('email')}
              error={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Telefone *"
              placeholder="11999999999"
              {...register('phone')}
              error={errors.phone}
            />

            <FormInput
              label="Empresa"
              placeholder="Tech Solutions"
              {...register('company')}
              error={errors.company}
            />
          </div>

          <FormInput
            label="Endereço"
            placeholder="Rua A, 123"
            {...register('address')}
            error={errors.address}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Cidade"
              placeholder="São Paulo"
              {...register('city')}
              error={errors.city}
            />

            <FormInput
              label="Estado"
              placeholder="SP"
              {...register('state')}
              error={errors.state}
              maxLength={2}
            />

            <FormInput
              label="CEP"
              placeholder="01310-100"
              {...register('zip_code')}
              error={errors.zip_code}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingId ? 'Atualizar' : 'Criar'} Cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Deletar Cliente"
        message={`Tem certeza que deseja deletar ${deleteConfirm.client?.name}? Esta ação não pode ser desfeita.`}
        isDangerous
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, client: null })}
      />
    </MainLayout>
  )
}
