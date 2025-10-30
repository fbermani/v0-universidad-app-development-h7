"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAppContext } from "@/context/AppContext"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { toast } from "sonner"
import type { HistoricalData } from "@/types"

export default function Settings() {
  const {
    configuration,
    updateConfiguration,
    historicalData,
    addHistoricalData,
    updateHistoricalData,
    deleteHistoricalData,
  } = useAppContext()

  const [exchangeRate, setExchangeRate] = useState((configuration?.exchangeRate || 1300).toString())
  const [pettyCash, setPettyCash] = useState((configuration?.pettyCash || 50000).toString())
  const [newCategory, setNewCategory] = useState("")
  const [newArea, setNewArea] = useState("")

  // Historical data form states
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [income, setIncome] = useState("")
  const [expenses, setExpenses] = useState("")

  // Edit mode states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMonth, setEditMonth] = useState("")
  const [editYear, setEditYear] = useState("")
  const [editIncome, setEditIncome] = useState("")
  const [editExpenses, setEditExpenses] = useState("")

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

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i
    return { value: year.toString(), label: year.toString() }
  })

  const handleUpdateExchangeRate = () => {
    const rate = Number.parseFloat(exchangeRate)
    if (isNaN(rate) || rate <= 0) {
      toast.error("Por favor ingrese una tasa de cambio válida")
      return
    }

    const updatedRatesARS = {
      individual: Math.round((configuration?.roomRates?.individual || 245) * rate),
      double: Math.round((configuration?.roomRates?.double || 190) * rate),
      triple: Math.round((configuration?.roomRates?.triple || 165) * rate),
      quadruple: Math.round((configuration?.roomRates?.quadruple || 150) * rate),
      quintuple: Math.round((configuration?.roomRates?.quintuple || 135) * rate),
    }

    updateConfiguration({
      exchangeRate: rate,
      roomRatesARS: updatedRatesARS,
      lastUpdated: new Date().toISOString(),
    })

    toast.success("Tasa de cambio actualizada correctamente")
  }

  const handleUpdatePettyCash = () => {
    const cash = Number.parseFloat(pettyCash)
    if (isNaN(cash) || cash < 0) {
      toast.error("Por favor ingrese un monto válido")
      return
    }

    updateConfiguration({
      pettyCash: cash,
    })

    toast.success("Caja chica actualizada correctamente")
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error("Por favor ingrese un nombre de categoría")
      return
    }

    if (configuration?.expenseCategories?.includes(newCategory)) {
      toast.error("Esta categoría ya existe")
      return
    }

    updateConfiguration({
      expenseCategories: [...(configuration?.expenseCategories || []), newCategory],
    })

    setNewCategory("")
    toast.success("Categoría agregada correctamente")
  }

  const handleRemoveCategory = (category: string) => {
    updateConfiguration({
      expenseCategories: (configuration?.expenseCategories || []).filter((c) => c !== category),
    })

    toast.success("Categoría eliminada correctamente")
  }

  const handleAddArea = () => {
    if (!newArea.trim()) {
      toast.error("Por favor ingrese un nombre de área")
      return
    }

    if (configuration?.maintenanceAreas?.includes(newArea)) {
      toast.error("Esta área ya existe")
      return
    }

    updateConfiguration({
      maintenanceAreas: [...(configuration?.maintenanceAreas || []), newArea],
    })

    setNewArea("")
    toast.success("Área agregada correctamente")
  }

  const handleRemoveArea = (area: string) => {
    updateConfiguration({
      maintenanceAreas: (configuration?.maintenanceAreas || []).filter((a) => a !== area),
    })

    toast.success("Área eliminada correctamente")
  }

  const handleAddHistoricalData = () => {
    const incomeValue = Number.parseFloat(income)
    const expensesValue = Number.parseFloat(expenses)

    if (isNaN(incomeValue) || incomeValue < 0) {
      toast.error("Por favor ingrese un monto de ingresos válido")
      return
    }

    if (isNaN(expensesValue) || expensesValue < 0) {
      toast.error("Por favor ingrese un monto de gastos válido")
      return
    }

    const period = `${selectedYear}-${(Number.parseInt(selectedMonth) + 1).toString().padStart(2, "0")}`

    // Check if period already exists
    if (historicalData.some((data) => data.period === period)) {
      toast.error("Ya existe un registro para este período")
      return
    }

    const newData: HistoricalData = {
      id: `hist-${Date.now()}`,
      period,
      income: incomeValue,
      expenses: expensesValue,
      result: incomeValue - expensesValue,
    }

    addHistoricalData(newData)

    setIncome("")
    setExpenses("")
    toast.success("Datos históricos agregados correctamente")
  }

  const startEdit = (data: HistoricalData) => {
    setEditingId(data.id)
    const [year, month] = data.period.split("-")
    setEditYear(year)
    setEditMonth((Number.parseInt(month) - 1).toString())
    setEditIncome(data.income.toString())
    setEditExpenses(data.expenses.toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditMonth("")
    setEditYear("")
    setEditIncome("")
    setEditExpenses("")
  }

  const saveEdit = (id: string) => {
    const incomeValue = Number.parseFloat(editIncome)
    const expensesValue = Number.parseFloat(editExpenses)

    if (isNaN(incomeValue) || incomeValue < 0) {
      toast.error("Por favor ingrese un monto de ingresos válido")
      return
    }

    if (isNaN(expensesValue) || expensesValue < 0) {
      toast.error("Por favor ingrese un monto de gastos válido")
      return
    }

    const period = `${editYear}-${(Number.parseInt(editMonth) + 1).toString().padStart(2, "0")}`

    // Check if period already exists (excluding current)
    if (historicalData.some((data) => data.period === period && data.id !== id)) {
      toast.error("Ya existe un registro para este período")
      return
    }

    updateHistoricalData(id, {
      period,
      income: incomeValue,
      expenses: expensesValue,
      result: incomeValue - expensesValue,
    })

    cancelEdit()
    toast.success("Datos históricos actualizados correctamente")
  }

  const handleDeleteHistoricalData = (id: string) => {
    deleteHistoricalData(id)
    toast.success("Datos históricos eliminados correctamente")
  }

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-")
    const monthName = months.find((m) => m.value === (Number.parseInt(month) - 1).toString())?.label
    return `${monthName} ${year}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!configuration) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Administre la configuración general del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasa de Cambio USD/ARS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Tasa Actual</Label>
              <Input
                id="exchangeRate"
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1300"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Última actualización:</span>
              <span>{new Date(configuration.lastUpdated).toLocaleDateString("es-AR")}</span>
            </div>
            <Button onClick={handleUpdateExchangeRate} className="w-full">
              Actualizar Tasa
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caja Chica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pettyCash">Monto Actual</Label>
              <Input
                id="pettyCash"
                type="number"
                value={pettyCash}
                onChange={(e) => setPettyCash(e.target.value)}
                placeholder="50000"
              />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(configuration.pettyCash)}</div>
            <Button onClick={handleUpdatePettyCash} className="w-full">
              Actualizar Caja Chica
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarifas de Habitaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-4">Tarifas en USD</h4>
              <div className="space-y-2">
                {Object.entries(configuration.roomRates || {}).map(([type, rate]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}</span>
                    <Badge variant="outline">${rate}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tarifas en ARS</h4>
              <div className="space-y-2">
                {Object.entries(configuration.roomRatesARS || {}).map(([type, rate]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}</span>
                    <Badge variant="secondary">{formatCurrency(rate)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías de Gastos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nueva categoría"
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(configuration.expenseCategories || []).map((category) => (
              <Badge key={category} variant="secondary" className="gap-2">
                {category}
                <button onClick={() => handleRemoveCategory(category)} className="hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Áreas de Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="Nueva área"
              onKeyPress={(e) => e.key === "Enter" && handleAddArea()}
            />
            <Button onClick={handleAddArea}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(configuration.maintenanceAreas || []).map((area) => (
              <Badge key={area} variant="secondary" className="gap-2">
                {area}
                <button onClick={() => handleRemoveArea(area)} className="hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos Históricos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Seleccionar año" />
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
            <div className="space-y-2">
              <Label htmlFor="income">Ingresos (ARS)</Label>
              <Input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenses">Gastos (ARS)</Label>
              <Input
                id="expenses"
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <Button onClick={handleAddHistoricalData} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Período
          </Button>

          {historicalData.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData
                    .sort((a, b) => b.period.localeCompare(a.period))
                    .map((data) => (
                      <TableRow key={data.id}>
                        {editingId === data.id ? (
                          <>
                            <TableCell>
                              <div className="flex gap-2">
                                <Select value={editMonth} onValueChange={setEditMonth}>
                                  <SelectTrigger className="w-[120px]">
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
                                <Select value={editYear} onValueChange={setEditYear}>
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
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editIncome}
                                onChange={(e) => setEditIncome(e.target.value)}
                                className="text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editExpenses}
                                onChange={(e) => setEditExpenses(e.target.value)}
                                className="text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  Number.parseFloat(editIncome) - Number.parseFloat(editExpenses) >= 0
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {formatCurrency(Number.parseFloat(editIncome) - Number.parseFloat(editExpenses))}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => saveEdit(data.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{formatPeriod(data.period)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.income)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(data.expenses)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={data.result >= 0 ? "default" : "destructive"}>
                                {formatCurrency(data.result)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => startEdit(data)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteHistoricalData(data.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
