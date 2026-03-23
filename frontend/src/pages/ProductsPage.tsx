import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'
import { Product } from '@/types'
import { Header } from '@/components/Header'
import { Message } from '@/components/Message'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'

export function ProductsPage() {
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    quantity: '',
    category: '',
  })

  useEffect(() => {
    console.log('ProductsPage mounted')
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      console.log('Fetching products from API...')
      setLoading(true)
      setError(null)
      const data = await apiService.getProducts()
      console.log('Raw data received:', data)
      
      let productsList = data
      if (data && typeof data === 'object' && 'items' in data) {
        console.log('Response has items property, using it')
        productsList = (data as any).items
      }
      
      console.log('Final products list:', productsList)
      setProducts(Array.isArray(productsList) ? productsList : [])
    } catch (err: any) {
      const errorMsg = err?.message || String(err)
      console.error('Error fetching products:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.sku || !formData.name || !formData.price) {
      setError('SKU, Nome e Preço são obrigatórios')
      return
    }
    try {
      setError(null)
      await apiService.createProduct({
        sku: formData.sku,
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
        category: formData.category,
      })
      setFormData({ sku: '', name: '', price: '', quantity: '', category: '' })
      setShowForm(false)
      setSuccessMessage('Produto criado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchProducts()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar produto')
    }
  }

  const handleUpdate = async (id: number) => {
    if (!formData.sku || !formData.name || !formData.price) {
      setError('SKU, Nome e Preço são obrigatórios')
      return
    }
    try {
      setError(null)
      await apiService.products.update(id, {
        sku: formData.sku,
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
        category: formData.category,
      })
      setEditingId(null)
      setFormData({ sku: '', name: '', price: '', quantity: '', category: '' })
      setSuccessMessage('Produto atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchProducts()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar produto')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Produto',
      message: 'Tem certeza que deseja deletar este produto?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      setError(null)
      await apiService.deleteProduct(id)
      setSuccessMessage('Produto deletado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchProducts()
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar produto')
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      sku: product.sku,
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category || '',
    })
  }

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center', backgroundColor: colors.bg, color: colors.text, minHeight: '100vh'}}>
        <h1>Carregando produtos...</h1>
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: colors.bg,
      color: colors.text,
      minHeight: '100vh',
    }}>
      <Header title="Produtos" />
      
      {error && (
        <Message 
          type="error" 
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {successMessage && (
        <Message 
          type="success" 
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      <h1>✅ Produtos ({products.length})</h1>
      
      <button 
        onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({ sku: '', name: '', price: '', quantity: '', category: '' })
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '700',
          fontSize: '14px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.paddingLeft = '30px'
          ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '30px'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.paddingLeft = '20px'
          ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '20px'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
        }}
      >
        {showForm ? 'Cancelar' : 'Novo Produto'}
      </button>

      {showForm && (
        <div style={{
          padding: '15px',
          backgroundColor: colors.bgSecondary,
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`
        }}>
          <h2 style={{marginTop: 0, color: colors.text}}>Criar Novo Produto</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <input 
              placeholder="SKU" 
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Nome" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Preço" 
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Quantidade" 
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Categoria" 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                gridColumn: '1 / -1'
              }}
            />
          </div>
          <button 
            onClick={handleCreate}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Criar Produto
          </button>
        </div>
      )}

      {editingId && (
        <div style={{
          padding: '15px',
          backgroundColor: colors.bgSecondary,
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`
        }}>
          <h2 style={{marginTop: 0, color: colors.text}}>Editar Produto</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <input 
              placeholder="SKU" 
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Nome" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Preço" 
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Quantidade" 
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Categoria" 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                gridColumn: '1 / -1'
              }}
            />
          </div>
          <button 
            onClick={() => handleUpdate(editingId)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Salvar
          </button>
          <button 
            onClick={() => {
              setEditingId(null)
              setFormData({ sku: '', name: '', price: '', quantity: '', category: '' })
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      
      {products.length === 0 ? (
        <p style={{color: colors.textSecondary}}>Nenhum produto encontrado</p>
      ) : (
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
          <thead>
            <tr style={{backgroundColor: colors.bgSecondary, borderBottom: `2px solid ${colors.border}`}}>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>SKU</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Nome</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Preço</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Quantidade</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Categoria</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr key={product.id} style={{
                backgroundColor: idx % 2 === 0 ? colors.bg : colors.bgSecondary,
                borderBottom: `1px solid ${colors.border}`
              }}>
                <td style={{padding: '10px', color: colors.text}}>{product.sku}</td>
                <td style={{padding: '10px', color: colors.text}}>{product.name}</td>
                <td style={{padding: '10px', color: colors.text}}>R$ {product.price.toFixed(2)}</td>
                <td style={{padding: '10px', color: colors.text}}>{product.quantity}</td>
                <td style={{padding: '10px', color: colors.text}}>{product.category || '-'}</td>
                <td style={{padding: '10px'}}>
                  <button
                    onClick={() => startEdit(product)}
                    style={{
                      padding: '5px 10px',
                      marginRight: '5px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.paddingLeft = '15px'
                      ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '15px'
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1565c0'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.paddingLeft = '10px'
                      ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '10px'
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2196F3'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.paddingLeft = '15px'
                      ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '15px'
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e53935'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.paddingLeft = '10px'
                      ;(e.currentTarget as HTMLButtonElement).style.paddingRight = '10px'
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f44336'
                    }}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{marginTop: '20px'}}>
        <button 
          onClick={() => fetchProducts()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
