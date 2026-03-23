import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users, ShoppingCart, DollarSign, Package } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout2'
import { StatCard, Button } from '@/components/ui/common'

// Sample Data
const salesData = [
  { month: 'Jan', sales: 4000, revenue: 2400 },
  { month: 'Fev', sales: 3000, revenue: 1398 },
  { month: 'Mar', sales: 2000, revenue: 9800 },
  { month: 'Abr', sales: 2780, revenue: 3908 },
  { month: 'Mai', sales: 1890, revenue: 4800 },
  { month: 'Jun', sales: 2390, revenue: 3800 },
]

const categoryData = [
  { name: 'Eletrônicos', value: 35 },
  { name: 'Vestuário', value: 25 },
  { name: 'Alimentos', value: 20 },
  { name: 'Outros', value: 20 },
]

const recentOrders = [
  { id: 1, client: 'João Silva', amount: 1500, status: 'completed' },
  { id: 2, client: 'Maria Santos', amount: 2300, status: 'processing' },
  { id: 3, client: 'Pedro Costa', amount: 890, status: 'pending' },
  { id: 4, client: 'Ana Oliveira', amount: 3200, status: 'completed' },
  { id: 5, client: 'Carlos Ferreira', amount: 1100, status: 'processing' },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function DashboardPage() {
  return (
    <MainLayout>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Bem-vindo ao seu ERP. Aqui está um resumo do seu negócio.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Receita Total"
          value="R$ 45,320"
          description="Este mês"
          icon={DollarSign}
          variant="blue"
        />
        <StatCard
          title="Pedidos"
          value="245"
          description="+12% vs mês anterior"
          icon={ShoppingCart}
          variant="green"
        />
        <StatCard
          title="Clientes"
          value="1,203"
          description="Ativos"
          icon={Users}
          variant="amber"
        />
        <StatCard
          title="Produtos"
          value="856"
          description="Em estoque"
          icon={Package}
          variant="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales & Revenue - 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Vendas vs Receita
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Distribuição por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Desempenho Mensal
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Pedidos Recentes
          </h3>
          <Button variant="ghost" size="sm">
            Ver Todos
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-slate-300">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-slate-300">
                  Valor
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-slate-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 text-gray-900 dark:text-slate-300">
                    {order.client}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-slate-300">
                    R$ {order.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : order.status === 'processing'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {order.status === 'completed'
                        ? 'Concluído'
                        : order.status === 'processing'
                        ? 'Processando'
                        : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}
