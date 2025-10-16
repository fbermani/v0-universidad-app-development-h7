"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Home,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Wrench,
  BedDouble,
  CreditCard,
  Receipt,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import { useMemo } from "react"
import { LogoFull } from "@/components/Logo"
import type { Payment } from "@/types"

export default function Dashboard() {
  const { state, dispatch } = useApp()

  // Memoizar cálculos para optimizar rendimiento
  const dashboardData = useMemo(() => {
    // Cálculos básicos
    const totalPlaces = state.rooms.reduce((sum, room) => sum + room.capacity, 0)
    const occupiedPlaces = state.rooms.reduce((sum, room) => sum + room.currentOccupancy, 0)
    const availablePlaces = totalPlaces - occupiedPlaces
    const occupancyRate = totalPlaces > 0 ? (occupiedPlaces / totalPlaces) * 100 : 0

    // Cálculos por género - FIXED
    const maleRooms = state.rooms.filter((room) => room.gender === "male")
    const femaleRooms = state.rooms.filter((room) => room.gender === "female")

    const maleOccupied = maleRooms.reduce((sum, room) => sum + room.currentOccupancy, 0)
    const femaleOccupied = femaleRooms.reduce((sum, room) => sum + room.currentOccupancy, 0)

    const maleTotal = maleRooms.reduce((sum, room) => sum + room.capacity, 0)
    const femaleTotal = femaleRooms.reduce((sum, room) => sum + room.capacity, 0)

    const maleAvailable = maleTotal - maleOccupied
    const femaleAvailable = femaleTotal - femaleOccupied

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Ingresos del mes actual
    const monthlyIncome = state.payments
      .filter((p) => {
        const paymentDate = new Date(p.date)
        return (
          p.status === "completed" &&
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, p) => sum + p.amount, 0)

    // Gastos del mes actual
    const monthlyExpenses = state.expenses
      .filter((e) => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, e) => sum + e.amount, 0)

    const monthlyResult = monthlyIncome - monthlyExpenses

    // Cálculos del mes anterior para variaciones
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const previousMonthIncome = state.payments
      .filter((p) => {
        const paymentDate = new Date(p.date)
        return (
          p.status === "completed" &&
          paymentDate.getMonth() === previousMonth &&
          paymentDate.getFullYear() === previousYear
        )
      })
      .reduce((sum, p) => sum + p.amount, 0)

    const previousMonthExpenses = state.expenses
      .filter((e) => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === previousMonth && expenseDate.getFullYear() === previousYear
      })
      .reduce((sum, e) => sum + e.amount, 0)

    const previousMonthResult = previousMonthIncome - previousMonthExpenses

    // Calcular variaciones porcentuales
    const incomeVariation =
      previousMonthIncome > 0 ? ((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100 : 0
    const expenseVariation =
      previousMonthExpenses > 0 ? ((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : 0
    const resultVariation =
      previousMonthResult !== 0 ? ((monthlyResult - previousMonthResult) / Math.abs(previousMonthResult)) * 100 : 0

    // Habitaciones vacantes (con plazas disponibles)
    const vacantRooms = state.rooms.filter((room) => room.currentOccupancy < room.capacity)

    // Pagos pendientes ordenados por habitación
    const pendingPayments = state.payments
      .filter((p) => p.status === "pending")
      .sort((a, b) => {
        const residentA = state.residents.find((r) => r.id === a.residentId)
        const residentB = state.residents.find((r) => r.id === b.residentId)
        const roomA = residentA ? state.rooms.find((r) => r.id === residentA.roomId) : null
        const roomB = residentB ? state.rooms.find((r) => r.id === residentB.roomId) : null

        if (!roomA || !roomB) return 0
        return Number.parseInt(roomA.number) - Number.parseInt(roomB.number)
      })

    const pendingPaymentsTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

    // Pagos recientes
    const recentPayments = state.payments
      .filter((p) => p.status === "completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    // Tareas de mantenimiento pendientes
    const pendingTasks = state.maintenanceTasks.filter((t) => t.status === "pending")
    const completedTasksThisMonth = state.maintenanceTasks.filter((t) => {
      if (t.status !== "completed" || !t.completedDate) return false
      const completedDate = new Date(t.completedDate)
      return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear
    })

    // Reservas próximas a ingresar
    const upcomingReservations = state.reservations
      .filter((reservation) => {
        const startDate = new Date(reservation.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        startDate.setHours(0, 0, 0, 0)

        return (reservation.status === "confirmed" || reservation.status === "pending") && startDate >= today
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    // Gastos pendientes - categorías sin asientos en el mes actual
    const expensesThisMonth = state.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })

    const categoriesWithExpenses = new Set(expensesThisMonth.map((expense) => expense.category))
    const pendingExpenseCategories = state.configuration.expenseCategories.filter(
      (category) => !categoriesWithExpenses.has(category),
    )

    return {
      totalPlaces,
      occupiedPlaces,
      availablePlaces,
      occupancyRate,
      maleOccupied,
      femaleOccupied,
      maleTotal,
      femaleTotal,
      maleAvailable,
      femaleAvailable,
      monthlyIncome,
      monthlyExpenses,
      monthlyResult,
      incomeVariation,
      expenseVariation,
      resultVariation,
      vacantRooms,
      pendingPayments,
      pendingPaymentsTotal,
      recentPayments,
      pendingTasks,
      completedTasksThisMonth,
      upcomingReservations,
      pendingExpenseCategories,
    }
  }, [state])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPaymentTypeLabel = (type: Payment["type"]) => {
    switch (type) {
      case "monthly_rent":
        return "Mensualidad"
      case "matricula":
        return "Matrícula"
      case "deposit":
        return "Depósito"
      default:
        return type
    }
  }

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <ArrowUpRight className="h-3 w-3 text-green-500" />
    if (variation < 0) return <ArrowDownRight className="h-3 w-3 text-red-500" />
    return null
  }

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-green-500"
    if (variation < 0) return "text-red-500"
    return "text-gray-400"
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 min-h-screen">
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LogoFull />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 bg-transparent"
          onClick={() => dispatch({ type: "GENERATE_MONTHLY_PAYMENTS" })}
        >
          <Eye className="h-4 w-4 mr-2" />
          Vista Detallada
        </Button>
      </div>

      {/* KPI Cards mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">Ocupación</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Home className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {dashboardData.occupiedPlaces}/{dashboardData.totalPlaces}
            </div>
            <Progress value={dashboardData.occupancyRate} className="mb-2 h-2" />
            <div className="space-y-1">
              <p className="text-xs text-blue-300">{dashboardData.occupancyRate.toFixed(1)}% ocupado</p>
              <div className="flex gap-4 text-xs text-blue-200">
                <span>
                  M {dashboardData.maleOccupied}/{dashboardData.maleTotal}
                </span>
                <span>
                  F {dashboardData.femaleOccupied}/{dashboardData.femaleTotal}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-200">Ingresos del Mes</CardTitle>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{formatCurrency(dashboardData.monthlyIncome)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-300">{new Date().toLocaleDateString("es-AR", { month: "long" })}</p>
              <div className={`flex items-center text-xs ${getVariationColor(dashboardData.incomeVariation)}`}>
                {getVariationIcon(dashboardData.incomeVariation)}
                <span className="ml-1">
                  {dashboardData.incomeVariation >= 0 ? "+" : ""}
                  {dashboardData.incomeVariation.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-200">Egresos del Mes</CardTitle>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{formatCurrency(dashboardData.monthlyExpenses)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-red-300">{new Date().toLocaleDateString("es-AR", { month: "long" })}</p>
              <div className={`flex items-center text-xs ${getVariationColor(-dashboardData.expenseVariation)}`}>
                {getVariationIcon(-dashboardData.expenseVariation)}
                <span className="ml-1">
                  {dashboardData.expenseVariation >= 0 ? "+" : ""}
                  {dashboardData.expenseVariation.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br backdrop-blur-sm ${
            dashboardData.monthlyResult >= 0
              ? "from-emerald-900/50 to-emerald-800/30 border-emerald-500/20"
              : "from-orange-900/50 to-orange-800/30 border-orange-500/20"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${
                dashboardData.monthlyResult >= 0 ? "text-emerald-200" : "text-orange-200"
              }`}
            >
              Resultado del Mes
            </CardTitle>
            <div
              className={`p-2 rounded-lg ${
                dashboardData.monthlyResult >= 0 ? "bg-emerald-500/20" : "bg-orange-500/20"
              }`}
            >
              <DollarSign
                className={`h-4 w-4 ${dashboardData.monthlyResult >= 0 ? "text-emerald-400" : "text-orange-400"}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold text-white mb-1`}>{formatCurrency(dashboardData.monthlyResult)}</div>
            <div className="flex items-center justify-between">
              <p className={`text-xs ${dashboardData.monthlyResult >= 0 ? "text-emerald-300" : "text-orange-300"}`}>
                {dashboardData.monthlyResult >= 0 ? "Ganancia" : "Pérdida"}
              </p>
              <div className={`flex items-center text-xs ${getVariationColor(dashboardData.resultVariation)}`}>
                {getVariationIcon(dashboardData.resultVariation)}
                <span className="ml-1">
                  {dashboardData.resultVariation >= 0 ? "+" : ""}
                  {dashboardData.resultVariation.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Cards mejoradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Plazas Vacantes */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                <BedDouble className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Plazas Vacantes
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {dashboardData.availablePlaces}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-normal mt-1">
                  M {dashboardData.maleAvailable} • F {dashboardData.femaleAvailable}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-3 pr-4">
                {dashboardData.vacantRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200">Habitación {room.number}</span>
                        {room.gender && (
                          <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                            {room.gender === "male" ? "M" : "F"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{room.type}</p>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {room.capacity - room.currentOccupancy} plazas
                    </Badge>
                  </div>
                ))}
                {dashboardData.vacantRooms.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Todas las habitaciones ocupadas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Próximos Ingresos */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Próximos Ingresos
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    {dashboardData.upcomingReservations.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-normal mt-1">Reservas confirmadas</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-3 pr-4">
                {dashboardData.upcomingReservations.map((reservation) => {
                  const resident = state.residents.find((r) => r.id === reservation.residentId)
                  const room = state.rooms.find((r) => r.id === reservation.roomId)
                  const daysUntil = Math.ceil(
                    (new Date(reservation.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                  )

                  return (
                    <div key={reservation.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-200 truncate">
                            {resident ? `${resident.firstName} ${resident.lastName}` : "Residente no encontrado"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Hab. {room?.number} • {new Date(reservation.startDate).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-sm font-medium text-purple-400">
                            {formatCurrency(reservation.matriculaAmount)}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              daysUntil <= 7 ? "text-orange-400 border-orange-400" : "text-blue-400 border-blue-400"
                            }`}
                          >
                            {daysUntil <= 0 ? "Hoy" : `${daysUntil}d`}
                          </Badge>
                        </div>
                      </div>
                      {reservation.discount && (
                        <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                          -{reservation.discount.value}
                          {reservation.discount.type === "percentage" ? "%" : " ARS"}
                        </Badge>
                      )}
                    </div>
                  )
                })}
                {dashboardData.upcomingReservations.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No hay ingresos próximos</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pagos Pendientes */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Pagos Pendientes
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                    {dashboardData.pendingPayments.length}
                  </Badge>
                </div>
                <p className="text-xs text-yellow-300 font-normal mt-1">
                  {formatCurrency(dashboardData.pendingPaymentsTotal)}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-3 pr-4">
                {dashboardData.pendingPayments.map((payment) => {
                  const resident = state.residents.find((r) => r.id === payment.residentId)
                  const room = resident ? state.rooms.find((r) => r.id === resident.roomId) : null
                  const isOverdue = new Date(payment.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

                  return (
                    <div
                      key={payment.id}
                      className={`p-3 rounded-lg border ${
                        isOverdue ? "bg-red-900/20 border-red-500/30" : "bg-gray-700/30 border-gray-600/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-200 truncate">
                            {resident ? `${resident.firstName} ${resident.lastName}` : "Residente no encontrado"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Hab. {room?.number || "N/A"} • {getPaymentTypeLabel(payment.type)}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-yellow-400"}`}>
                            {formatCurrency(payment.amount)}
                          </div>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Vencido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {dashboardData.pendingPayments.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No hay pagos pendientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Últimos Pagos */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                <CreditCard className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Últimos Pagos
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {dashboardData.recentPayments.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-normal mt-1">Pagos recientes</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-3 pr-4">
                {dashboardData.recentPayments.map((payment) => {
                  const resident = state.residents.find((r) => r.id === payment.residentId)
                  const room = resident ? state.rooms.find((r) => r.id === resident.roomId) : null
                  const daysAgo = Math.floor(
                    (new Date().getTime() - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24),
                  )

                  return (
                    <div key={payment.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-200 truncate">
                            {resident ? `${resident.firstName} ${resident.lastName}` : "Residente no encontrado"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Hab. {room?.number || "N/A"} • {daysAgo === 0 ? "Hoy" : `${daysAgo}d atrás`}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-sm font-medium text-green-400">{formatCurrency(payment.amount)}</div>
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                            {getPaymentTypeLabel(payment.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {dashboardData.recentPayments.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No hay pagos recientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tareas de Mantenimiento */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                <Wrench className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Mantenimiento
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                    {dashboardData.pendingTasks.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-normal mt-1">
                  {dashboardData.completedTasksThisMonth.length} completadas este mes
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-3 pr-4">
                {dashboardData.pendingTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200">{task.description}</div>
                        <div className="text-xs text-gray-400">{task.area}</div>
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
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(task.assignedDate).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                ))}
                {dashboardData.pendingTasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No hay tareas pendientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Gastos Pendientes */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center text-base">
              <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                <Receipt className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Gastos Pendientes
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    {dashboardData.pendingExpenseCategories.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-normal mt-1">Categorías sin asientos</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-3 pr-4">
                {dashboardData.pendingExpenseCategories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
                  >
                    <span className="text-sm font-medium text-gray-200">{category}</span>
                    <Badge variant="outline" className="text-orange-400 border-orange-400 text-xs">
                      Sin asiento
                    </Badge>
                  </div>
                ))}
                {dashboardData.pendingExpenseCategories.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Todas las categorías completas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
