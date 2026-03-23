import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'
import { Client } from '@/types'
import { Header } from '@/components/Header'
import { Message } from '@/components/Message'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'

export function ClientsPage() {
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
  })

  useEffect(() => {
    console.log('ClientsPage mounted')
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      console.log('Fetching clients from API...')
      setLoading(true)
      setError(null)
      const data = await apiService.getClients()
      console.log('Raw data received:', data)
      
      let clientsList = data
      if (data && typeof data === 'object' && 'items' in data) {
        console.log('Response has items property, using it')
        clientsList = (data as any).items
      }
      
      console.log('Final clients list:', clientsList)
      setClients(Array.isArray(clientsList) ? clientsList : [])
    } catch (err: any) {
      const errorMsg = err?.message || String(err)
      console.error('Error fetching clients:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.email) {
      setError('Nome e Email são obrigatórios')
      return
    }
    if (formData.name.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido')
      return
    }
    try {
      setError(null)
      console.log('Creating client with data:', formData)
      const result = await apiService.createClient(formData)
      console.log('Client created:', result)
      setFormData({ name: '', email: '', phone: '', city: '' })
      setShowForm(false)
      setSuccessMessage('Cliente criado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchClients()
    } catch (err: any) {
      console.error('Full error:', err)
      setError(err.message || 'Erro ao criar cliente')
    }
  }

  const handleUpdate = async (id: number) => {
    if (!formData.name || !formData.email) {
      setError('Nome e Email são obrigatórios')
      return
    }
    if (formData.name.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido')
      return
    }
    try {
      setError(null)
      console.log('Updating client with data:', formData)
      const result = await apiService.clients.update(id, formData)
      console.log('Client updated:', result)
      setEditingId(null)
      setFormData({ name: '', email: '', phone: '', city: '' })
      setSuccessMessage('Cliente atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchClients()
    } catch (err: any) {
      console.error('Full error:', err)
      setError(err.message || 'Erro ao atualizar cliente')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Cliente',
      message: 'Tem certeza que deseja deletar este cliente?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      setError(null)
      await apiService.deleteClient(id)
      setSuccessMessage('Cliente deletado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchClients()
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar cliente')
    }
  }

  const startEdit = (client: Client) => {
    setEditingId(client.id)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      city: client.city || '',
    })
  }

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center', backgroundColor: colors.bg, color: colors.text, minHeight: '100vh'}}>
        <h1>Carregando clientes...</h1>
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
      <Header title="Clientes" />
      
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
      
      <button 
        onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({ name: '', email: '', phone: '', city: '' })
          setError(null)
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
        {showForm ? 'Cancelar' : 'Novo Cliente'}
      </button>

      {showForm && (
        <div style={{
          padding: '15px',
          backgroundColor: colors.bgSecondary,
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`
        }}>
          <h2 style={{marginTop: 0}}>Criar Novo Cliente</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <input 
              placeholder="Nome" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
              }}
            />
            <input 
              placeholder="Email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
              }}
            />
            <input 
              placeholder="Telefone" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
              }}
            />
            <input 
              placeholder="Cidade" 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
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
            Criar Cliente
          </button>
        </div>
      )}

      {editingId && (
        <div style={{
          padding: '15px',
          backgroundColor: colors.bgSecondary,
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid #87CEEB`
        }}>
          <h2 style={{marginTop: 0}}>Editar Cliente</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <input 
              placeholder="Nome" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
              }}
            />
            <input 
              placeholder="Email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
              }}
            />
            <input 
              placeholder="Telefone" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
              }}
            />
            <input 
              placeholder="Cidade" 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              style={{
                padding: '8px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.input,
                color: colors.text,
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
              setFormData({ name: '', email: '', phone: '', city: '' })
              setError(null)
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
      
      {clients.length === 0 ? (
        <p style={{color: colors.textSecondary}}>Nenhum cliente encontrado</p>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px',
          backgroundColor: colors.input,
          border: `1px solid ${colors.border}`,
        }}>
          <thead>
            <tr style={{backgroundColor: colors.bgSecondary, borderBottom: `2px solid ${colors.border}`}}>
              <th style={{padding: '10px', textAlign: 'left', borderRight: `1px solid ${colors.border}`}}>Nome</th>
              <th style={{padding: '10px', textAlign: 'left', borderRight: `1px solid ${colors.border}`}}>Email</th>
              <th style={{padding: '10px', textAlign: 'left', borderRight: `1px solid ${colors.border}`}}>Telefone</th>
              <th style={{padding: '10px', textAlign: 'left', borderRight: `1px solid ${colors.border}`}}>Cidade</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} style={{borderBottom: `1px solid ${colors.border}`}}>
                <td style={{padding: '10px', borderRight: `1px solid ${colors.border}`}}>{client.name}</td>
                <td style={{padding: '10px', borderRight: `1px solid ${colors.border}`}}>{client.email}</td>
                <td style={{padding: '10px', borderRight: `1px solid ${colors.border}`}}>{client.phone || '-'}</td>
                <td style={{padding: '10px', borderRight: `1px solid ${colors.border}`}}>{client.city || '-'}</td>
                <td style={{padding: '10px'}}>
                  <button
                    onClick={() => startEdit(client)}
                    style={{
                      padding: '5px 10px',
                      marginRight: '5px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    🗑️ Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{marginTop: '20px'}}>
        <button 
          onClick={() => fetchClients()}
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
