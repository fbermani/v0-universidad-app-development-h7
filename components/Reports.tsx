"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, DollarSign, Users, Download, PieChart, Home, CreditCard } from "lucide-react"
import { useApp } from "../context/AppContext"
import { LogoFull } from "@/components/Logo"

export default function Reports() {
  const { state } = useApp()
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (selectedPeriod) {
      case "annual":
        startDate = new Date(Number(selectedYear), 0, 1)
        endDate = new Date(Number(selectedYear), 11, 31)
        break
      case "last3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case "last6months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        break
      case "monthly":
      default:
        startDate = new Date(Number(selectedYear), Number(selectedMonth), 1)
        endDate = new Date(Number(selectedYear), Number(selectedMonth) + 1, 0)
        break
    }

    return { startDate, endDate }
  }

  const getPeriodData = () => {
    const { startDate, endDate } = getDateRange()

    const payments = state.payments.filter((payment) => {
      const paymentDate = new Date(payment.date)
      return payment.status === "completed" && paymentDate >= startDate && paymentDate <= endDate
    })

    const expenses = state.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate && expenseDate <= endDate
    })

    const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netResult = totalIncome - totalExpenses

    const expensesByCategory = expenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      },
      {} as Record<string, number>,
    )

    const expensesByMethod = expenses.reduce(
      (acc, expense) => {
        const methodName =
          expense.method === "cash"
            ? "Efectivo"
            : expense.method === "transfer"
              ? "Transferencia"
              : expense.method === "card"
                ? "Tarjeta"
                : "Caja Chica"
        acc[methodName] = (acc[methodName] || 0) + expense.amount
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate income by room type
    const incomeByRoomType = payments.reduce(
      (acc, payment) => {
        if (payment.type === "monthly_rent" && payment.residentId !== "general-income") {
          const resident = state.residents.find((r) => r.id === payment.residentId)
          if (resident) {
            const room = state.rooms.find((r) => r.id === resident.roomId)
            if (room) {
              const roomTypeName =
                room.type === "individual"
                  ? "Individual"
                  : room.type === "double"
                    ? "Doble"
                    : room.type === "triple"
                      ? "Triple"
                      : room.type === "quadruple"
                        ? "Cuádruple"
                        : "Quíntuple"
              acc[roomTypeName] = (acc[roomTypeName] || 0) + payment.amount
            }
          }
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate income by type
    const incomeByType = payments.reduce(
      (acc, payment) => {
        const type =
          payment.type === "monthly_rent"
            ? "Mensualidad"
            : payment.type === "matricula"
              ? "Matrícula"
              : payment.type === "deposit"
                ? "Depósito"
                : payment.type === "utilities"
                  ? "Servicios"
                  : "Otro"
        acc[type] = (acc[type] || 0) + payment.amount
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalIncome,
      totalExpenses,
      netResult,
      payments,
      expenses,
      expensesByCategory,
      expensesByMethod,
      incomeByType,
      incomeByRoomType,
    }
  }

  const periodData = getPeriodData()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "annual":
        return `Año ${selectedYear}`
      case "last3months":
        return "Últimos 3 meses"
      case "last6months":
        return "Últimos 6 meses"
      case "monthly":
      default:
        return `${monthNames[Number(selectedMonth)]} ${selectedYear}`
    }
  }

  const handleExportData = () => {
    const reportData = {
      periodo: getPeriodLabel(),
      resumen: {
        ingresos: periodData.totalIncome,
        egresos: periodData.totalExpenses,
        resultado: periodData.netResult,
      },
      ingresos: periodData.payments.map((payment) => ({
        fecha: new Date(payment.date).toLocaleDateString("es-AR"),
        residente:
          state.residents.find((r) => r.id === payment.residentId)?.firstName +
          " " +
          state.residents.find((r) => r.id === payment.residentId)?.lastName,
        concepto:
          payment.type === "monthly_rent" ? "Mensualidad" : payment.type === "matricula" ? "Matrícula" : payment.type,
        metodo: payment.method === "cash" ? "Efectivo" : "Transferencia",
        monto: payment.amount,
        recibo: payment.receiptNumber,
      })),
      egresos: periodData.expenses.map((expense) => ({
        fecha: new Date(expense.date).toLocaleDateString("es-AR"),
        categoria: expense.category,
        descripcion: expense.description,
        metodo:
          expense.method === "cash" ? "Efectivo" : expense.method === "transfer" ? "Transferencia" : expense.method,
        monto: expense.amount,
      })),
      gastosPorCategoria: periodData.expensesByCategory,
      gastosPorMetodo: periodData.expensesByMethod,
      ingresosPorTipoHabitacion: periodData.incomeByRoomType,
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reporte-${getPeriodLabel().replace(/\s+/g, "-")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <LogoFull />
          <div>
            <h2 className="text-3xl font-bold text-white">Informes</h2>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="last3months">Últimos 3 meses</SelectItem>
              <SelectItem value="last6months">Últimos 6 meses</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === "monthly" && (
            <>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {selectedPeriod === "annual" && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleExportData}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(periodData.totalIncome)}</div>
            <p className="text-xs text-gray-400">{periodData.payments.length} pagos</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(periodData.totalExpenses)}</div>
            <p className="text-xs text-gray-400">{periodData.expenses.length} gastos</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Resultado</CardTitle>
            <DollarSign className={`h-4 w-4 ${periodData.netResult >= 0 ? "text-green-400" : "text-red-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${periodData.netResult >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(periodData.netResult)}
            </div>
            <p className="text-xs text-gray-400">{periodData.netResult >= 0 ? "Ganancia" : "Pérdida"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Ocupación</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {state.rooms.reduce((sum, room) => sum + room.currentOccupancy, 0)}/
              {state.rooms.reduce((sum, room) => sum + room.capacity, 0)}
            </div>
            <p className="text-xs text-gray-400">
              {Math.round(
                (state.rooms.reduce((sum, room) => sum + room.currentOccupancy, 0) /
                  state.rooms.reduce((sum, room) => sum + room.capacity, 0)) *
                  100,
              )}
              % ocupado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ingresos por Categoría de Habitación */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Ingresos por Categoría de Habitación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(periodData.incomeByRoomType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-300">{type}</span>
                    <span className="text-green-400 font-bold">{formatCurrency(amount)}</span>
                  </div>
                ))}
              {Object.keys(periodData.incomeByRoomType).length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay ingresos por habitaciones en este período</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ingresos por Concepto */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Ingresos por Concepto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(periodData.incomeByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-300">{type}</span>
                    <span className="text-green-400 font-bold">{formatCurrency(amount)}</span>
                  </div>
                ))}
              {Object.keys(periodData.incomeByType).length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay ingresos en este período</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoría */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Gastos por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(periodData.expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = ((amount / periodData.totalExpenses) * 100).toFixed(1)
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300 text-sm">{category}</span>
                          <span className="text-gray-400 text-xs">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-red-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                      <span className="text-red-400 font-bold ml-4 min-w-[100px] text-right">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                })}
              {Object.keys(periodData.expensesByCategory).length === 0 && (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No hay gastos en este período</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gastos por Método de Pago */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Gastos por Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(periodData.expensesByMethod)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const percentage = ((amount / periodData.totalExpenses) * 100).toFixed(1)
                  return (
                    <div key={method} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300 text-sm">{method}</span>
                          <span className="text-gray-400 text-xs">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                      <span className="text-orange-400 font-bold ml-4 min-w-[100px] text-right">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                })}
              {Object.keys(periodData.expensesByMethod).length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay gastos en este período</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
