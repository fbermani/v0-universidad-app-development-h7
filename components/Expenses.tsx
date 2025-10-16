"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Receipt,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import type { Expense } from "../types"
import { LogoText } from "@/components/Logo"

export default function Expenses() {
  const { state, dispatch } = useApp()
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [isAddingPettyCash, setIsAddingPettyCash] = useState(false)
  const [isPettyCashDetailsOpen, setIsPettyCashDetailsOpen] = useState(false)
  const [pettyCashFilter, setPettyCashFilter] = useState<string>("current")
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    method: "cash" as Expense["method"],
    description: "",
  })
  const [pettyCashAmount, setPettyCashAmount] = useState("")

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyExpenses = state.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const totalMonthlyExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const categoriesWithExpenses = new Set(monthlyExpenses.map((expense) => expense.category))
  const pendingCategories = state.configuration.expenseCategories.filter(
    (category) => !categoriesWithExpenses.has(category),
  )

  const expensesByCategory = state.configuration.expenseCategories.map((category) => {
    const categoryExpenses = monthlyExpenses.filter((expense) => expense.category === category)
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      category,
      expenses: categoryExpenses,
      total,
      hasExpenses: categoryExpenses.length > 0,
    }
  })

  // Petty Cash movements filtering
  const getPettyCashMovements = () => {
    let movements = state.expenses.filter((expense) => {
      return expense.method === "petty_cash" || expense.amount < 0 // negative amounts are inflows
    })

    if (pettyCashFilter === "current") {
      movements = movements.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
    } else if (pettyCashFilter === "year") {
      movements = movements.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getFullYear() === currentYear
      })
    } else if (pettyCashFilter.startsWith("month-")) {
      const month = Number.parseInt(pettyCashFilter.split("-")[1])
      movements = movements.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === currentYear
      })
    }

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const pettyCashMovements = getPettyCashMovements()

  const pettyCashInflows = pettyCashMovements
    .filter((m) => m.amount < 0)
    .reduce((sum, m) => sum + Math.abs(m.amount), 0)
  const pettyCashOutflows = pettyCashMovements.filter((m) => m.amount > 0).reduce((sum, m) => sum + m.amount, 0)

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.description) return

    const expense: Expense = {
      id: Date.now().toString(),
      category: newExpense.category,
      amount: Number(newExpense.amount),
      currency: "ARS",
      method: newExpense.method,
      date: new Date().toISOString(),
      description: newExpense.description,
    }

    dispatch({ type: "ADD_EXPENSE", payload: expense })

    setNewExpense({
      category: "",
      amount: "",
      method: "cash",
      description: "",
    })
    setIsAddingExpense(false)
  }

  const handleAddPettyCash = () => {
    if (!pettyCashAmount) return

    const amount = Number(pettyCashAmount)
    if (amount <= 0) return

    dispatch({ type: "UPDATE_PETTY_CASH", payload: state.pettyCash + amount })

    // Registrar como ingreso a caja chica
    const expense: Expense = {
      id: Date.now().toString(),
      category: "Caja Chica",
      amount: -amount, // Negativo porque es un ingreso
      currency: "ARS",
      method: "petty_cash",
      date: new Date().toISOString(),
      description: "Agregado de saldo a caja chica",
    }

    dispatch({ type: "ADD_EXPENSE", payload: expense })

    setPettyCashAmount("")
    setIsAddingPettyCash(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getMethodLabel = (method: Expense["method"]) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "transfer":
        return "Transferencia"
      case "credit_card":
        return "Tarjeta de Crédito"
      case "petty_cash":
        return "Caja Chica"
      default:
        return method
    }
  }

  const getMethodColor = (method: Expense["method"]) => {
    switch (method) {
      case "cash":
        return "text-green-400 border-green-400"
      case "transfer":
        return "text-blue-400 border-blue-400"
      case "credit_card":
        return "text-purple-400 border-purple-400"
      case "petty_cash":
        return "text-yellow-400 border-yellow-400"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const getMonthName = (monthIndex: number) => {
    const months = [
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
    return months[monthIndex]
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <LogoText />
          <div>
            <h2 className="text-3xl font-bold text-white">Gastos</h2>
            <p className="text-gray-400">Gestión de gastos y categorías</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingPettyCash} onOpenChange={setIsAddingPettyCash}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white bg-transparent"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Agregar Caja Chica
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Agregar Saldo a Caja Chica</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-700 rounded">
                  <div className="flex justify-between items-center">
                    <span>Saldo actual:</span>
                    <span className="font-bold text-yellow-400">{formatCurrency(state.pettyCash)}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="pettyCashAmount">Monto a agregar</Label>
                  <Input
                    id="pettyCashAmount"
                    type="number"
                    value={pettyCashAmount}
                    onChange={(e) => setPettyCashAmount(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                    placeholder="0"
                  />
                </div>
                {pettyCashAmount && (
                  <div className="p-3 bg-green-900/20 border border-green-600 rounded">
                    <div className="flex justify-between items-center">
                      <span>Nuevo saldo:</span>
                      <span className="font-bold text-green-400">
                        {formatCurrency(state.pettyCash + Number(pettyCashAmount))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                  onClick={() => setIsAddingPettyCash(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddPettyCash}
                  disabled={!pettyCashAmount || Number(pettyCashAmount) <= 0}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Agregar Saldo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {state.configuration.expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                          {pendingCategories.includes(category) && (
                            <Badge variant="outline" className="ml-2 text-orange-400 border-orange-400 text-xs">
                              Pendiente
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Monto (ARS)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Método de Pago</Label>
                  <Select
                    value={newExpense.method}
                    onValueChange={(value: Expense["method"]) => setNewExpense({ ...newExpense, method: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="petty_cash">
                        Caja Chica ({formatCurrency(state.pettyCash)} disponible)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    rows={3}
                    placeholder="Descripción del gasto..."
                  />
                </div>
                {newExpense.method === "petty_cash" && Number(newExpense.amount) > state.pettyCash && (
                  <div className="p-3 bg-red-900/20 border border-red-600 rounded">
                    <p className="text-red-400 text-sm">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Saldo insuficiente en caja chica
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                  onClick={() => setIsAddingExpense(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddExpense}
                  disabled={
                    !newExpense.category ||
                    !newExpense.amount ||
                    !newExpense.description ||
                    (newExpense.method === "petty_cash" && Number(newExpense.amount) > state.pettyCash)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Agregar Gasto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expense Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Gastos del Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totalMonthlyExpenses)}</div>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Categorías Completas</CardTitle>
            <Receipt className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {state.configuration.expenseCategories.length - pendingCategories.length}
            </div>
            <p className="text-xs text-gray-400">de {state.configuration.expenseCategories.length} categorías</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Categorías Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{pendingCategories.length}</div>
            <p className="text-xs text-gray-400">sin asientos este mes</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => setIsPettyCashDetailsOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Caja Chica</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(state.pettyCash)}</div>
            <p className="text-xs text-gray-400">Click para ver detalle</p>
          </CardContent>
        </Card>
      </div>

      {/* Petty Cash Details Dialog */}
      <Dialog open={isPettyCashDetailsOpen} onOpenChange={setIsPettyCashDetailsOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-yellow-400" />
              Movimientos de Caja Chica
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2 items-center">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Select value={pettyCashFilter} onValueChange={setPettyCashFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="current">Mes Actual</SelectItem>
                  <SelectItem value="year">Todo el Año</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={`month-${i}`}>
                      {getMonthName(i)} {currentYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Ingresos</p>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(pettyCashInflows)}</p>
                    </div>
                    <ArrowUpCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Egresos</p>
                      <p className="text-xl font-bold text-red-400">{formatCurrency(pettyCashOutflows)}</p>
                    </div>
                    <ArrowDownCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Saldo Actual</p>
                      <p className="text-xl font-bold text-yellow-400">{formatCurrency(state.pettyCash)}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Movements List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Movimientos</h4>
              {pettyCashMovements.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-400 mb-2">No hay movimientos</h4>
                  <p className="text-gray-500">No se encontraron movimientos en el período seleccionado</p>
                </div>
              ) : (
                pettyCashMovements.map((movement) => {
                  const isInflow = movement.amount < 0
                  return (
                    <Card key={movement.id} className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            {isInflow ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-400 mt-1" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-red-400 mt-1" />
                            )}
                            <div>
                              <h4 className="text-white font-medium">
                                {isInflow ? "Ingreso a Caja Chica" : movement.category}
                              </h4>
                              <p className="text-gray-400 text-sm">{movement.description}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {new Date(movement.date).toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isInflow ? "text-green-400" : "text-red-400"}`}>
                              {isInflow ? "+" : "-"}
                              {formatCurrency(Math.abs(movement.amount))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Categorías de Gastos</h3>
          <div className="space-y-3">
            {expensesByCategory.map((categoryData) => (
              <Card key={categoryData.category} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-medium">{categoryData.category}</h4>
                    <Badge
                      variant="outline"
                      className={
                        categoryData.hasExpenses
                          ? "text-green-400 border-green-400"
                          : "text-orange-400 border-orange-400"
                      }
                    >
                      {categoryData.hasExpenses ? "Completa" : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total del mes:</span>
                    <span className={`font-bold ${categoryData.hasExpenses ? "text-red-400" : "text-gray-500"}`}>
                      {categoryData.hasExpenses ? formatCurrency(categoryData.total) : "Sin gastos"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Asientos:</span>
                    <span className="text-white">{categoryData.expenses.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-4">Gastos Recientes</h3>
          <div className="space-y-3">
            {monthlyExpenses
              .slice(-10)
              .reverse()
              .map((expense) => (
                <Card key={expense.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">{expense.category}</h4>
                        <p className="text-gray-400 text-sm">{expense.description}</p>
                      </div>
                      <Badge variant="outline" className={getMethodColor(expense.method)}>
                        {getMethodLabel(expense.method)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Monto:</span>
                      <span className="text-red-400 font-bold">{formatCurrency(Math.abs(expense.amount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-white">{new Date(expense.date).toLocaleDateString("es-AR")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {monthlyExpenses.length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No hay gastos este mes</h4>
                <p className="text-gray-500">Los gastos registrados aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
