import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users, Plus, Trash2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { FormInput, FormSelect, FormCheckbox } from '@/components/forms/FormFields'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button, StatCard, Badge } from '@/components/ui/common'
import { userSchema, UserFormData } from '@/lib/validation'

interface User {
  id: number
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      full_name: 'João Silva',
      email: 'joao@example.com',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-15',
    },
    {
      id: 2,
      full_name: 'Maria Santos',
      email: 'maria@example.com',
      role: 'user',
      is_active: true,
      created_at: '2024-02-20',
    },
    {
      id: 3,
      full_name: 'Pedro Costa',
      email: 'pedro@example.com',
      role: 'viewer',
      is_active: false,
      created_at: '2024-03-10',
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id)
      reset({
        full_name: user.full_name,
        email: user.email,
        role: user.role as any,
        is_active: user.is_active,
      })
    } else {
      setEditingId(null)
      reset({ full_name: '', email: '', role: 'user', is_active: true })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    reset()
  }

  const onSubmit = (data: UserFormData) => {
    if (editingId) {
      setUsers(
        users.map((u) =>
          u.id === editingId
            ? {
                ...u,
                ...data,
                updated_at: new Date().toISOString(),
              }
            : u
        )
      )
    } else {
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id), 0) + 1,
        ...data,
        created_at: new Date().toISOString(),
      }
      setUsers([...users, newUser])
    }
    handleCloseModal()
  }

  const handleDelete = async (user: User) => {
    setDeleteConfirm({ isOpen: true, user })
  }

  const confirmDelete = () => {
    if (deleteConfirm.user) {
      setUsers(users.filter((u) => u.id !== deleteConfirm.user!.id))
      setDeleteConfirm({ isOpen: false, user: null })
    }
  }

  const columns: Column<User>[] = [
    {
      header: 'Nome',
      accessor: 'full_name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Perfil',
      accessor: 'role',
      render: (row) => {
        const roleColors = {
          admin: 'red',
          user: 'blue',
          viewer: 'gray',
        }
        return (
          <Badge variant={roleColors[row.role as keyof typeof roleColors] as any}>
            {row.role}
          </Badge>
        )
      },
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'green' : 'gray'}>
          {row.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      header: 'Data Criação',
      accessor: 'created_at',
      render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR'),
    },
  ]

  const totalPages = Math.ceil(users.length / itemsPerPage)
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const adminCount = users.filter((u) => u.role === 'admin').length
  const activeCount = users.filter((u) => u.is_active).length

  return (
    <MainLayout title="Gestão de Usuários">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Usuários"
          value={users.length}
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Usuários Ativos"
          value={activeCount}
          description={`${((activeCount / users.length) * 100).toFixed(0)}% do total`}
          variant="green"
        />
        <StatCard
          title="Administradores"
          value={adminCount}
          variant="red"
        />
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => handleOpenModal()}
        >
          Novo Usuário
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <DataTable<User>
          columns={columns}
          data={paginatedUsers}
          onEdit={(user) => handleOpenModal(user)}
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
        title={editingId ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Nome Completo"
            placeholder="João Silva"
            {...register('full_name')}
            error={errors.full_name}
          />

          <FormInput
            label="Email"
            type="email"
            placeholder="joao@example.com"
            {...register('email')}
            error={errors.email}
          />

          {!editingId && (
            <FormInput
              label="Senha"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password}
              helperText="Mínimo 6 caracteres"
            />
          )}

          <FormSelect
            label="Perfil"
            options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'user', label: 'Usuário' },
              { value: 'viewer', label: 'Visualizador' },
            ]}
            {...register('role')}
            error={errors.role}
          />

          <FormCheckbox
            label="Usuário Ativo"
            {...register('is_active')}
            error={errors.is_active}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingId ? 'Atualizar' : 'Criar'} Usuário
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Deletar Usuário"
        message={`Tem certeza que deseja deletar ${deleteConfirm.user?.full_name}? Esta ação não pode ser desfeita.`}
        isDangerous
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, user: null })}
      />
    </MainLayout>
  )
}
