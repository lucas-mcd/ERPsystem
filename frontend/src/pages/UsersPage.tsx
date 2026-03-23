import { useState, useEffect } from 'react'
import { usePermission } from '@/hooks/useAuth'
import { useConfirmDialog, useAlert } from '@/hooks/useConfirmDialog'
import { apiService } from '@/services/api'
import { User } from '@/types'
import { Header } from '@/components/Header'
import { Message } from '@/components/Message'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/contexts/ThemeContext'

export function UsersPage() {
  const { isAdmin } = usePermission()
  const { showConfirm } = useConfirmDialog()
  const alert = useAlert()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'viewer',
  })

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      setError('Acesso negado. Apenas administradores podem acessar esta página.')
      return
    }
    console.log('UsersPage mounted, fetching users...')
    fetchUsers()
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from API...')
      setLoading(true)
      setError(null)
      const data = await apiService.getUsers()
      console.log('Raw data received:', data)
      
      let usersList = data
      if (data && typeof data === 'object' && 'items' in data) {
        console.log('Response has items property, using it')
        usersList = (data as any).items
      }
      
      console.log('Final users list:', usersList)
      setUsers(Array.isArray(usersList) ? usersList : [])
    } catch (err: any) {
      const errorMsg = err?.message || String(err)
      console.error('Error fetching users:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Nome, Email e Senha são obrigatórios')
      return
    }
    try {
      await apiService.createUser(formData)
      setFormData({ full_name: '', email: '', password: '', role: 'user' })
      setShowForm(false)
      setSuccessMessage('Usuário criado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchUsers()
    } catch (err: any) {
      const errorMsg = err?.message || String(err)
      setError(errorMsg)
    }
  }

  const handleUpdate = async (id: number) => {
    if (!formData.full_name || !formData.email) {
      setError('Nome e Email são obrigatórios')
      return
    }
    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      await apiService.users.update(id, updateData)
      setEditingId(null)
      setFormData({ full_name: '', email: '', password: '', role: 'user' })
      setSuccessMessage('Usuário atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchUsers()
    } catch (err: any) {
      const errorMsg = err?.message || String(err)
      setError(errorMsg)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Deletar Usuário',
      message: 'Tem certeza que deseja deletar este usuário?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await apiService.deleteUser(id)
      setSuccessMessage('Usuário deletado com sucesso!')
      setTimeout(() => setSuccessMessage(null), 5000)
      fetchUsers()
    } catch (err: any) {
      const errorMsg = err?.message || String(err)
      setError(errorMsg)
    }
  }

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role as 'user' | 'admin' | 'viewer',
    })
  }

  if (!isAdmin && !loading) {
    return (
      <div style={{padding: '20px', backgroundColor: colors.bg, color: colors.text, minHeight: '100vh'}}>
        <Header title="👥 Usuários" />
        <Message 
          type="error" 
          message="Acesso negado. Apenas administradores podem acessar esta página."
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center', backgroundColor: colors.bg, color: colors.text, minHeight: '100vh'}}>
        <h1>Carregando usuários...</h1>
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
      <Header title="Usuários" />
      
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
      <h1>Usuários ({users.length})</h1>
      
      <button 
        onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({ full_name: '', email: '', password: '', role: 'user' })
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
        {showForm ? 'Cancelar' : 'Novo Usuário'}
      </button>

      {showForm && (
        <div style={{
          padding: '15px',
          backgroundColor: colors.bgSecondary,
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`
        }}>
          <h2 style={{marginTop: 0, color: colors.text}}>Criar Novo Usuário</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <input 
              placeholder="Nome Completo" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Senha (mín. 8 caracteres)" 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'admin' | 'viewer'})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            >
              <option value="viewer">Visualizador</option>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
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
            Criar Usuário
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
          <h2 style={{marginTop: 0, color: colors.text}}>Editar Usuário</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <input 
              placeholder="Nome Completo" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <input 
              placeholder="Senha (deixar em branco para não alterar)" 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            />
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'admin' | 'viewer'})}
              style={{
                padding: '8px',
                backgroundColor: colors.input,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '4px'
              }}
            >
              <option value="viewer">Visualizador</option>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
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
              setFormData({ full_name: '', email: '', password: '', role: 'user' })
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
      
      {users.length === 0 ? (
        <p style={{color: colors.textSecondary}}>Nenhum usuário encontrado</p>
      ) : (
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
          <thead>
            <tr style={{backgroundColor: colors.bgSecondary, borderBottom: `2px solid ${colors.border}`}}>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Nome</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Email</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Papel (Role)</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Ativo</th>
              <th style={{padding: '10px', textAlign: 'left', color: colors.text}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{
                backgroundColor: idx % 2 === 0 ? colors.bg : colors.bgSecondary,
                borderBottom: `1px solid ${colors.border}`
              }}>
                <td style={{padding: '10px', color: colors.text}}>{user.full_name}</td>
                <td style={{padding: '10px', color: colors.text}}>{user.email}</td>
                <td style={{padding: '10px'}}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: user.role === 'admin' ? '#ff4444' : user.role === 'user' ? '#4444ff' : '#999999',
                      color: 'white',
                    }}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td style={{padding: '10px', color: colors.text}}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </td>
                <td style={{padding: '10px'}}>
                  <button
                    onClick={() => startEdit(user)}
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
                    onClick={() => handleDelete(user.id)}
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
          onClick={() => fetchUsers()}
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
