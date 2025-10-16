"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Home,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Wrench,
  BedDouble,
  CreditCard,
  Receipt,
  Settings,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react"
import {
  mockRooms,
  mockResidents,
  mockPayments,
  mockExpenses,
  mockMaintenanceTasks,
  mockReservations,
  mockNewResidents,
  mockConfiguration,
} from "../data/mockData"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Cálculos para el dashboard
  const totalPlaces = mockRooms.reduce((sum, room) => sum + room.capacity, 0)
  const occupiedPlaces = mockRooms.reduce((sum, room) => sum + room.currentOccupancy, 0)
  const availablePlaces = totalPlaces - occupiedPlaces

  const monthlyIncome = mockPayments
    .filter((p) => p.status === "completed" && new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amount, 0)

  const monthlyExpenses = mockExpenses
    .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0)

  const monthlyResult = monthlyIncome - monthlyExpenses

  const vacantRooms = mockRooms.filter((room) => room.status === "available")
  const pendingPayments = mockPayments.filter((p) => p.status === "pending")
  const pendingPaymentsTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const recentPayments = mockPayments.filter((p) => p.status === "completed").slice(-3)
  const pendingTasks = mockMaintenanceTasks.filter((t) => t.status === "pending")

  // Reservas próximas a ingresar (próximos 30 días)
  const upcomingReservations = mockReservations.filter((reservation) => {
    const startDate = new Date(reservation.startDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return reservation.status === "confirmed" && startDate >= today && startDate <= thirtyDaysFromNow
  })

  // Gastos pendientes - categorías sin asientos en el mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const expensesThisMonth = mockExpenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const categoriesWithExpenses = new Set(expensesThisMonth.map((expense) => expense.category))
  const pendingExpenseCategories = mockConfiguration.expenseCategories.filter(
    (category) => !categoriesWithExpenses.has(category),
  )

  const menuItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Users, label: "Residentes" },
    { icon: BedDouble, label: "Habitaciones" },
    { icon: Calendar, label: "Reservas" },
    { icon: CreditCard, label: "Pagos" },
    { icon: Receipt, label: "Gastos" },
    { icon: Wrench, label: "Mantenimiento" },
    { icon: TrendingUp, label: "Informes" },
    { icon: Settings, label: "Configuración" },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">ResiApp</h1>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-400 hidden lg:block">ResiApp</h1>
          </div>

          <nav className="mt-6">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                  item.active ? "bg-gray-700 text-white border-r-2 border-blue-400" : ""
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white">Dashboard</h2>
              <p className="text-gray-400">Resumen general de la residencia</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Ocupación</CardTitle>
                  <Home className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {occupiedPlaces}/{totalPlaces}
                  </div>
                  <p className="text-xs text-gray-400">{Math.round((occupiedPlaces / totalPlaces) * 100)}% ocupado</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Ingresos del Mes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(monthlyIncome)}</div>
                  <p className="text-xs text-gray-400">Diciembre 2024</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Egresos del Mes</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(monthlyExpenses)}</div>
                  <p className="text-xs text-gray-400">Diciembre 2024</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Resultado del Mes</CardTitle>
                  <DollarSign className={`h-4 w-4 ${monthlyResult >= 0 ? "text-green-400" : "text-red-400"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${monthlyResult >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(monthlyResult)}
                  </div>
                  <p className="text-xs text-gray-400">{monthlyResult >= 0 ? "Ganancia" : "Pérdida"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Plazas Vacantes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BedDouble className="h-5 w-5 mr-2 text-blue-400" />
                    Plazas Vacantes ({availablePlaces})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vacantRooms.map((room) => (
                      <div key={room.id} className="flex justify-between items-center">
                        <span className="text-gray-300">Hab. {room.number}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          {room.type} - {room.capacity} plazas
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Próximos Ingresos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                    Próximos Ingresos ({upcomingReservations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingReservations.map((reservation) => {
                      const resident = mockNewResidents.find((r) => r.id === reservation.residentId)
                      const room = mockRooms.find((r) => r.id === reservation.roomId)
                      return (
                        <div key={reservation.id} className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-gray-300">
                              {resident?.firstName} {resident?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Hab. {room?.number} - {new Date(reservation.startDate).toLocaleDateString("es-AR")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-purple-400">{formatCurrency(reservation.matriculaAmount)}</div>
                            {reservation.discount && (
                              <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                                -{reservation.discount.value}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {upcomingReservations.length === 0 && (
                      <p className="text-gray-500 text-sm">No hay ingresos próximos</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pagos Pendientes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                    Pagos Pendientes ({pendingPayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400 mb-4">{formatCurrency(pendingPaymentsTotal)}</div>
                  <div className="space-y-2">
                    {pendingPayments.slice(0, 3).map((payment) => {
                      const resident = mockResidents.find((r) => r.id === payment.residentId)
                      return (
                        <div key={payment.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            {resident?.firstName} {resident?.lastName}
                          </span>
                          <span className="text-yellow-400">{formatCurrency(payment.amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Últimos Pagos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-400" />
                    Últimos Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentPayments.map((payment) => {
                      const resident = mockResidents.find((r) => r.id === payment.residentId)
                      return (
                        <div key={payment.id} className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-gray-300">
                              {resident?.firstName} {resident?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(payment.date).toLocaleDateString("es-AR")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-400">{formatCurrency(payment.amount)}</div>
                            <Badge variant="outline" className="text-xs">
                              {payment.method === "cash" ? "Efectivo" : "Transferencia"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Gastos Pendientes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-orange-400" />
                    Gastos Pendientes ({pendingExpenseCategories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingExpenseCategories.slice(0, 6).map((category) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{category}</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400 text-xs">
                          Sin asiento
                        </Badge>
                      </div>
                    ))}
                    {pendingExpenseCategories.length === 0 && (
                      <p className="text-gray-500 text-sm">Todas las categorías tienen asientos</p>
                    )}
                    {pendingExpenseCategories.length > 6 && (
                      <p className="text-xs text-gray-500">+{pendingExpenseCategories.length - 6} categorías más</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tareas Pendientes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Wrench className="h-5 w-5 mr-2 text-cyan-400" />
                    Tareas Pendientes ({pendingTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm text-gray-300">{task.description}</div>
                          <div className="text-xs text-gray-500">{task.area}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`ml-2 ${
                            task.priority === "high"
                              ? "text-red-400 border-red-400"
                              : task.priority === "medium"
                                ? "text-yellow-400 border-yellow-400"
                                : "text-green-400 border-green-400"
                          }`}
                        >
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-around items-center py-2">
          {menuItems.slice(0, 4).map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center p-2 ${item.active ? "text-blue-400" : "text-gray-400"}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 text-gray-400">
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs mt-1">Más</span>
          </Button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
