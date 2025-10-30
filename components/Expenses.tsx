"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/context/AppContext"
import {
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { toast } from "sonner"

export default function Expenses() {
  const { state, dispatch } = useAppContext()

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "card" | "petty_cash">("cash")

  const months = [
    { value: "0", label: "Enero" },
    { value: "1", label: "Febrero" },
    { value: "2", label: "Marzo" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Mayo" },
    { value: "5", label: "Junio" },
    { value: "6", label: "Julio" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Septiembre" },
    { value: "9", label: "Octubre" },
    { value: "10", label: "Noviembre" },
    { value: "11", label: "Diciembre" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return { value: year.toString(), label: year.toString() }
  })

  const filteredExpenses = useMemo(() => {
    if (!state.expenses) return []
    return state.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return (
        expenseDate.getMonth() === Number.parseInt(selectedMonth) &&
        expenseDate.getFullYear() === Number.parseInt(selectedYear)
      )
    })
  }, [state.expenses, selectedMonth, selectedYear])

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [filteredExpenses])

  const previousMonthData = useMemo(() => {
    if (!state.expenses) return { total: 0, percentage: 0, isIncrease: false }

    const currentMonth = Number.parseInt(selectedMonth)
    const currentYear = Number.parseInt(selectedYear)

    let prevMonth = currentMonth - 1
    let prevYear = currentYear

    if (prevMonth < 0) {
      prevMonth = 11
      prevYear = currentYear - 1
    }

    const previousMonthExpenses = state.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear
    })

    const previousTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    let percentage = 0
    let isIncrease = false

    if (previousTotal > 0) {
      const difference = totalExpenses - previousTotal
      percentage = Math.abs((difference / previousTotal) * 100)
      isIncrease = difference > 0
    } else if (totalExpenses > 0) {
      percentage = 100
      isIncrease = true
    }

    return {
      total: previousTotal,
      percentage: Math.round(percentage * 10) / 10,
      isIncrease,
    }
  }, [state.expenses, selectedMonth, selectedYear, totalExpenses])

  const expensesByCategory = useMemo(() => {
    const grouped = filteredExpenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0
        }
        acc[expense.category] += expense.amount
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredExpenses])

  const pendingCategories = useMemo(() => {
    if (!state.configuration?.expenseCategories) return []
    const categoriesWithExpenses = new Set(filteredExpenses.map((e) => e.category))
    return state.configuration.expenseCategories.filter((cat) => !categoriesWithExpenses.has(cat))
  }, [filteredExpenses, state.configuration])

  const handleAddExpense = () => {
    if (!category) {
      toast.error("Por favor seleccione una categoría")
      return
    }
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Por favor ingrese un monto válido")
      return
    }

    const newExpense = {
      id: `expense-${Date.now()}`,
      category,
      description,
      amount: Number.parseFloat(amount),
      currency: "ARS" as const,
      date: new Date().toISOString(),
      method: paymentMethod,
    }

    dispatch({ type: "ADD_EXPENSE", payload: newExpense })

    setCategory("")
    setAmount("")
    setDescription("")
    setPaymentMethod("cash")

    toast.success("Gasto registrado correctamente")
  }

  const handleDeleteExpense = (id: string) => {
    if (confirm("¿Está seguro de eliminar este gasto?")) {
      const expense = state.expenses.find((e) => e.id === id)
      if (expense && expense.method === "petty_cash") {
        dispatch({ type: "UPDATE_PETTY_CASH", payload: state.pettyCash + expense.amount })
      }
      dispatch({ type: "UPDATE_EXPENSE", payload: { id } as any })
      toast.success("Gasto eliminado correctamente")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando gastos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Gastos</h2>
        <p className="text-muted-foreground">Registre y administre los gastos operativos de la residencia</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredExpenses.length} gasto{filteredExpenses.length !== 1 ? "s" : ""} registrado
              {filteredExpenses.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Mes Previo</CardTitle>
            {previousMonthData.isIncrease ? (
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(previousMonthData.total)}</div>
            <div className="flex items-center gap-1 mt-1">
              {previousMonthData.isIncrease ? (
                <TrendingUp className="h-3 w-3 text-red-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600" />
              )}
              <p className={`text-xs font-medium ${previousMonthData.isIncrease ? "text-red-600" : "text-green-600"}`}>
                {previousMonthData.isIncrease ? "+" : "-"}
                {previousMonthData.percentage}%
              </p>
              <p className="text-xs text-muted-foreground">vs mes actual</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCategories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Categoría{pendingCategories.length !== 1 ? "s" : ""} sin asiento
              {pendingCategories.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {state.configuration.expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto (ARS)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: "cash" | "transfer" | "card" | "petty_cash") => setPaymentMethod(value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="petty_cash">Caja Chica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddExpense} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Gastos por Categoría</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="space-y-3">
                {expensesByCategory.map(({ category, amount }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <Badge variant="secondary">{formatCurrency(amount)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No hay gastos registrados para este período</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorías Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCategories.length > 0 ? (
              <div className="space-y-2">
                {pendingCategories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">{cat}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Todas las categorías tienen gastos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>{expense.description || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.method === "cash"
                              ? "default"
                              : expense.method === "petty_cash"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {expense.method === "cash"
                            ? "Efectivo"
                            : expense.method === "transfer"
                              ? "Transferencia"
                              : expense.method === "card"
                                ? "Tarjeta"
                                : "Caja Chica"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingDown className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No hay gastos registrados</p>
              <p className="text-sm">Los gastos aparecerán aquí una vez que los registre</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
