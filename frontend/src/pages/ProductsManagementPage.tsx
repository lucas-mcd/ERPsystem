import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Plus, Search, AlertTriangle } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { FormInput, FormSelect, FormTextarea } from '@/components/forms/FormFields'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button, StatCard, Badge } from '@/components/ui/common'
import { productSchema, ProductFormData } from '@/lib/validation'

interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: number
  cost: number
  stock: number
  description?: string
  is_active: boolean
  created_at: string
}

export function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Notebook Dell',
      sku: 'NB-001',
      category: 'Eletrônicos',
      price: 3500,
      cost: 2800,
      stock: 15,
      description: 'Notebook Dell com processador Intel Core i7',
      is_active: true,
      created_at: '2024-01-15',
    },
    {
      id: 2,
      name: 'Mouse Logitech',
      sku: 'MS-001',
      category: 'Periféricos',
      price: 150,
      cost: 80,
      stock: 5,
      description: 'Mouse wireless',
      is_active: true,
      created_at: '2024-02-10',
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id)
      reset({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        description: product.description,
        is_active: product.is_active,
      })
    } else {
      setEditingId(null)
      reset({ name: '', sku: '', category: '', price: 0, cost: 0, stock: 0, is_active: true })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    reset()
  }

  const onSubmit = (data: ProductFormData) => {
    if (editingId) {
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ...data,
              }
            : p
        )
      )
    } else {
      const newProduct: Product = {
        id: Math.max(...products.map((p) => p.id), 0) + 1,
        ...data,
        created_at: new Date().toISOString(),
      }
      setProducts([...products, newProduct])
    }
    handleCloseModal()
  }

  const handleDelete = (product: Product) => {
    setDeleteConfirm({ isOpen: true, product })
  }

  const confirmDelete = () => {
    if (deleteConfirm.product) {
      setProducts(products.filter((p) => p.id !== deleteConfirm.product!.id))
      setDeleteConfirm({ isOpen: false, product: null })
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns: Column<Product>[] = [
    {
      header: 'Produto',
      accessor: 'name',
    },
    {
      header: 'SKU',
      accessor: 'sku',
    },
    {
      header: 'Categoria',
      accessor: 'category',
    },
    {
      header: 'Preço',
      accessor: 'price',
      render: (row) => `R$ ${row.price.toFixed(2)}`,
    },
    {
      header: 'Estoque',
      accessor: 'stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.stock < 10 && <AlertTriangle className="w-4 h-4 text-amber-600" />}
          <span>{row.stock}</span>
        </div>
      ),
    },
    {
      header: 'Margem',
      accessor: 'cost',
      render: (row) => {
        const margin = ((row.price - row.cost) / row.price * 100).toFixed(1)
        return <Badge variant="green">{margin}%</Badge>
      },
    },
  ]

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const lowStockCount = products.filter((p) => p.stock < 10).length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

  return (
    <MainLayout title="Gestão de Produtos">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Produtos"
          value={products.length}
          icon={Package}
          variant="blue"
        />
        <StatCard
          title="Estoque Baixo"
          value={lowStockCount}
          description="Produtos com menos de 10 unidades"
          variant="amber"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${(totalValue / 1000).toFixed(0)}k`}
          description="Investimento em estoque"
          variant="green"
        />
      </div>

      {/* Actions and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
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
          Novo Produto
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <DataTable<Product>
          columns={columns}
          data={paginatedProducts}
          onEdit={(product) => handleOpenModal(product)}
          onDelete={handleDelete}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Nome *"
              placeholder="Notebook Dell"
              {...register('name')}
              error={errors.name}
            />
            <FormInput
              label="SKU *"
              placeholder="NB-001"
              {...register('sku')}
              error={errors.sku}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Categoria *"
              options={[
                { value: 'Eletrônicos', label: 'Eletrônicos' },
                { value: 'Periféricos', label: 'Periféricos' },
                { value: 'Software', label: 'Software' },
              ]}
              {...register('category')}
              error={errors.category}
            />
            <FormInput
              label="Preço (R$) *"
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              error={errors.price}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Custo (R$) *"
              type="number"
              step="0.01"
              {...register('cost', { valueAsNumber: true })}
              error={errors.cost}
            />
            <FormInput
              label="Estoque *"
              type="number"
              {...register('stock', { valueAsNumber: true })}
              error={errors.stock}
            />
          </div>

          <FormTextarea
            label="Descrição"
            placeholder="Descrição do produto..."
            {...register('description')}
            error={errors.description}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingId ? 'Atualizar' : 'Criar'} Produto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Deletar Produto"
        message={`Tem certeza que deseja deletar ${deleteConfirm.product?.name}?`}
        isDangerous
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, product: null })}
      />
    </MainLayout>
  )
}
