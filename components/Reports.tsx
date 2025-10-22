"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Download,
  PieChart,
  Home,
  CreditCard,
  BarChart3,
  Table2,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import { LogoFull } from "@/components/Logo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ViewMode = "table" | "pie" | "bar"
type ValueMode = "nominal" | "percentage"

export default function Reports() {
  const { state } = useApp()
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  // View modes for different sections
  const [expensesCategoryView, setExpensesCategoryView] = useState<ViewMode>("table")
  const [expensesCategoryValueMode, setExpensesCategoryValueMode] = useState<ValueMode>("nominal")
  const [expensesMethodView, setExpensesMethodView] = useState<ViewMode>("pie")
  const [incomeRoomView, setIncomeRoomView] = useState<ViewMode>("bar")
  const [resultView, setResultView] = useState<ViewMode>("bar")
  const [resultValueMode, setResultValueMode] = useState<ValueMode>("nominal")

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

  const formatPercentage = (amount: number, total: number) => {
    if (total === 0) return "0%"
    return `${((amount / total) * 100).toFixed(1)}%`
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

  const renderPieChart = (data: Record<string, number>, colors: string[]) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)
    if (total === 0) return <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>

    let currentAngle = 0
    const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a)

    return (
      <div className="space-y-4">
        <div className="relative h-64 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-64 h-64">
            {sortedData.map(([key, value], index) => {
              const percentage = (value / total) * 100
              const angle = (percentage / 100) * 360
              const x1 = 100 + 80 * Math.cos((currentAngle - 90) * (Math.PI / 180))
              const y1 = 100 + 80 * Math.sin((currentAngle - 90) * (Math.PI / 180))
              const x2 = 100 + 80 * Math.cos((currentAngle + angle - 90) * (Math.PI / 180))
              const y2 = 100 + 80 * Math.sin((currentAngle + angle - 90) * (Math.PI / 180))
              const largeArc = angle > 180 ? 1 : 0

              const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`
              currentAngle += angle

              return (
                <path key={key} d={path} fill={colors[index % colors.length]} stroke="rgb(31 41 55)" strokeWidth="2" />
              )
            })}
            <circle cx="100" cy="100" r="40" fill="rgb(31 41 55)" />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sortedData.map(([key, value], index) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-300 truncate">{key}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderBarChart = (data: Record<string, number>, color: string, valueMode: ValueMode = "nominal") => {
    const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a)
    const maxValue = Math.max(...Object.values(data))
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)

    if (sortedData.length === 0) {
      return <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>
    }

    return (
      <div className="space-y-3">
        {sortedData.map(([key, value]) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          const displayValue = valueMode === "nominal" ? formatCurrency(value) : formatPercentage(value, total)

          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{key}</span>
                <span className="font-bold" style={{ color }}>
                  {displayValue}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTable = (data: Record<string, number>, valueMode: ValueMode = "nominal") => {
    const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a)
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)

    if (sortedData.length === 0) {
      return <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-gray-400">Categoría</TableHead>
            <TableHead className="text-right text-gray-400">Monto</TableHead>
            <TableHead className="text-right text-gray-400">Porcentaje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="text-gray-300">{key}</TableCell>
              <TableCell className="text-right font-medium text-white">{formatCurrency(value)}</TableCell>
              <TableCell className="text-right text-gray-400">{formatPercentage(value, total)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-600">
            <TableCell className="font-bold text-white">Total</TableCell>
            <TableCell className="text-right font-bold text-white">{formatCurrency(total)}</TableCell>
            <TableCell className="text-right font-bold text-white">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  const pieColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#84cc16",
  ]

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

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ingresos por Categoría de Habitación */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Ingresos por Categoría de Habitación
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={incomeRoomView === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIncomeRoomView("table")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={incomeRoomView === "pie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIncomeRoomView("pie")}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={incomeRoomView === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIncomeRoomView("bar")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {incomeRoomView === "table" && renderTable(periodData.incomeByRoomType)}
            {incomeRoomView === "pie" && renderPieChart(periodData.incomeByRoomType, pieColors)}
            {incomeRoomView === "bar" && renderBarChart(periodData.incomeByRoomType, "#22c55e")}
          </CardContent>
        </Card>

        {/* Resultado: Ingresos vs Egresos */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Resultado: Ingresos vs Egresos
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={resultValueMode === "nominal" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setResultValueMode("nominal")}
                  className="text-xs"
                >
                  $
                </Button>
                <Button
                  variant={resultValueMode === "percentage" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setResultValueMode("percentage")}
                  className="text-xs"
                >
                  %
                </Button>
                <Button
                  variant={resultView === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setResultView("bar")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={resultView === "pie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setResultView("pie")}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {resultView === "bar" &&
              renderBarChart(
                { Ingresos: periodData.totalIncome, Egresos: periodData.totalExpenses },
                "#3b82f6",
                resultValueMode,
              )}
            {resultView === "pie" &&
              renderPieChart({ Ingresos: periodData.totalIncome, Egresos: periodData.totalExpenses }, [
                "#22c55e",
                "#ef4444",
              ])}
          </CardContent>
        </Card>
      </div>

      {/* Expenses Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoría */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Gastos por Categoría
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={expensesCategoryValueMode === "nominal" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesCategoryValueMode("nominal")}
                  className="text-xs"
                >
                  $
                </Button>
                <Button
                  variant={expensesCategoryValueMode === "percentage" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesCategoryValueMode("percentage")}
                  className="text-xs"
                >
                  %
                </Button>
                <Button
                  variant={expensesCategoryView === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesCategoryView("table")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={expensesCategoryView === "pie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesCategoryView("pie")}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={expensesCategoryView === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesCategoryView("bar")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expensesCategoryView === "table" && renderTable(periodData.expensesByCategory, expensesCategoryValueMode)}
            {expensesCategoryView === "pie" && renderPieChart(periodData.expensesByCategory, pieColors)}
            {expensesCategoryView === "bar" &&
              renderBarChart(periodData.expensesByCategory, "#ef4444", expensesCategoryValueMode)}
          </CardContent>
        </Card>

        {/* Gastos por Método de Pago */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Gastos por Método de Pago
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={expensesMethodView === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesMethodView("table")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={expensesMethodView === "pie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesMethodView("pie")}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={expensesMethodView === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setExpensesMethodView("bar")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expensesMethodView === "table" && renderTable(periodData.expensesByMethod)}
            {expensesMethodView === "pie" && renderPieChart(periodData.expensesByMethod, pieColors)}
            {expensesMethodView === "bar" && renderBarChart(periodData.expensesByMethod, "#f97316")}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
