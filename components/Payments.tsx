"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  Receipt,
  AlertTriangle,
  DollarSign,
  Plus,
  Percent,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Download,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import type { Payment, Resident, Room } from "../types"
import { LogoFull } from "@/components/Logo"

export default function Payments() {
  const { state, dispatch } = useApp()
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isNewPayment, setIsNewPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none")
  const [discountValue, setDiscountValue] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "cancelled">("all")
  const [filterType, setFilterType] = useState<"all" | "monthly_rent" | "matricula" | "deposit">("all")

  // New payment form
  const [newPaymentForm, setNewPaymentForm] = useState({
    residentId: "general-income", // Default to general income
    type: "deposit" as "monthly_rent" | "matricula" | "deposit",
    amount: "",
    method: "cash" as "cash" | "transfer",
    notes: "",
  })

  // Filter payments based on search and filters
  const filteredPayments = state.payments.filter((payment) => {
    const resident = state.residents.find((r) => r.id === payment.residentId)
    const room = resident ? state.rooms.find((r) => r.id === resident.roomId) : null

    // Search filter
    const searchMatch =
      searchTerm === "" ||
      (resident && `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room && room.number.includes(searchTerm)) ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const statusMatch = filterStatus === "all" || payment.status === filterStatus

    // Type filter
    const typeMatch = filterType === "all" || payment.type === filterType

    return searchMatch && statusMatch && typeMatch
  })

  const pendingPayments = filteredPayments.filter((p) => p.status === "pending")
  const completedPayments = filteredPayments.filter((p) => p.status === "completed")
  const cancelledPayments = filteredPayments.filter((p) => p.status === "cancelled")

  // Ordenar pagos pendientes por número de habitación
  const sortedPendingPayments = pendingPayments.sort((a, b) => {
    const residentA = state.residents.find((r) => r.id === a.residentId)
    const residentB = state.residents.find((r) => r.id === b.residentId)
    const roomA = residentA ? state.rooms.find((r) => r.id === residentA.roomId) : null
    const roomB = residentB ? state.rooms.find((r) => r.id === residentB.roomId) : null

    if (!roomA || !roomB) return 0
    return Number.parseInt(roomA.number) - Number.parseInt(roomB.number)
  })

  const handleProcessPayment = () => {
    if (!selectedPayment || !paymentAmount) return

    let finalAmount = Number(paymentAmount)

    // Aplicar descuento si existe
    if (discountType === "percentage" && discountValue) {
      const discountAmount = (finalAmount * Number(discountValue)) / 100
      finalAmount = finalAmount - discountAmount
    } else if (discountType === "fixed" && discountValue) {
      finalAmount = finalAmount - Number(discountValue)
    }

    if (finalAmount <= 0 || finalAmount > selectedPayment.amount) return

    const updatedPayment: Payment = {
      ...selectedPayment,
      amount: finalAmount,
      method: paymentMethod,
      status: "completed",
      receiptNumber: `REC-${Date.now()}`,
      date: new Date().toISOString(),
    }

    dispatch({ type: "UPDATE_PAYMENT", payload: updatedPayment })

    setSelectedPayment(null)
    setPaymentAmount("")
    setDiscountType("none")
    setDiscountValue("")
    setIsProcessingPayment(false)
  }

  const handleNewPayment = (status: "pending" | "completed") => {
    if (!newPaymentForm.residentId || !newPaymentForm.amount) return

    const newPayment: Payment = {
      id: Date.now().toString(),
      residentId: newPaymentForm.residentId,
      amount: Number(newPaymentForm.amount),
      currency: "ARS",
      method: newPaymentForm.method,
      date: new Date().toISOString(),
      type: newPaymentForm.type,
      status: status,
      receiptNumber: status === "completed" ? `REC-${Date.now()}` : undefined,
    }

    dispatch({ type: "ADD_PAYMENT", payload: newPayment })

    setNewPaymentForm({
      residentId: "general-income",
      type: "deposit",
      amount: "",
      method: "cash",
      notes: "",
    })
    setIsNewPayment(false)
  }

  const handleSelectPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setPaymentAmount(payment.amount.toString())
    setIsProcessingPayment(true)
  }

  const handleCancelPayment = (payment: Payment) => {
    const updatedPayment: Payment = {
      ...payment,
      status: "cancelled",
      date: new Date().toISOString(),
    }
    dispatch({ type: "UPDATE_PAYMENT", payload: updatedPayment })
  }

  const getResident = (residentId: string): Resident | undefined => {
    if (residentId === "general-income") {
      return {
        id: "general-income",
        firstName: "Ingreso",
        lastName: "General",
        email: "N/A",
        phone: "N/A",
        emergencyContact: { name: "N/A", phone: "N/A", relationship: "N/A" },
        roomId: "",
        checkInDate: "",
        status: "active",
        behaviorNotes: [],
        documents: [],
      } as Resident
    }
    return state.residents.find((r) => r.id === residentId)
  }

  const getRoom = (roomId: string): Room | undefined => {
    if (roomId === "") {
      return {
        id: "",
        number: "N/A",
        type: "individual",
        capacity: 0,
        currentOccupancy: 0,
        status: "available",
        monthlyRate: 0,
      } as Room
    }
    return state.rooms.find((r) => r.id === roomId)
  }

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

  const getPaymentTypeColor = (type: Payment["type"]) => {
    switch (type) {
      case "monthly_rent":
        return "text-blue-400 border-blue-400"
      case "matricula":
        return "text-purple-400 border-purple-400"
      case "deposit":
        return "text-green-400 border-green-400"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getMethodIcon = (method: Payment["method"]) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4 text-green-400" />
      case "transfer":
        return <CreditCard className="h-4 w-4 text-blue-400" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-400" />
    }
  }

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalCompleted = completedPayments
    .filter((p) => {
      const paymentDate = new Date(p.date)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  const availableResidents = [
    {
      id: "general-income",
      firstName: "Ingreso",
      lastName: "General",
      email: "",
      phone: "",
      emergencyContact: { name: "", phone: "", relationship: "" },
      roomId: "",
      checkInDate: "",
      status: "active" as const,
      behaviorNotes: [],
      documents: [],
    },
    ...state.residents.filter((r) => r.status === "active" && r.id !== "general-income"),
    ...state.reservations
      .filter((r) => r.status === "confirmed")
      .map((reservation) => {
        const mockResident = state.residents.find((r) => r.id === reservation.residentId) || {
          id: reservation.residentId,
          firstName: `Reserva ${reservation.id}`,
          lastName: "",
          email: "",
          phone: "",
          emergencyContact: { name: "", phone: "", relationship: "" },
          roomId: reservation.roomId,
          checkInDate: reservation.startDate,
          status: "pending" as const,
          behaviorNotes: [],
          documents: [],
        }
        return mockResident
      }),
  ]

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 min-h-screen">
      {/* Header mejorado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LogoFull />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Pagos
            </h1>
            <p className="text-gray-400 mt-1">Gestión de pagos y cobros</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => setIsNewPayment(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pago
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda mejorados */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por residente, habitación o recibo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-[140px] bg-gray-700/50 border-gray-600/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full sm:w-[140px] bg-gray-700/50 border-gray-600/50">
                  <Receipt className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="monthly_rent">Mensualidad</SelectItem>
                  <SelectItem value="matricula">Matrícula</SelectItem>
                  <SelectItem value="deposit">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Statistics mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-200">Pagos Pendientes</CardTitle>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-yellow-300">{pendingPayments.length} pagos pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-200">Cobrado este Mes</CardTitle>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{formatCurrency(totalCompleted)}</div>
            <p className="text-xs text-green-300">
              {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">Total Pagos</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Receipt className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">{filteredPayments.length}</div>
            <p className="text-xs text-blue-300">
              {completedPayments.length} completados, {cancelledPayments.length} cancelados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Promedio por Pago</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {completedPayments.length > 0
                ? formatCurrency(completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-purple-300">Promedio de pagos completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para organizar los pagos */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-400"
          >
            <Clock className="h-4 w-4 mr-2" />
            Pendientes ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completados ({completedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
            <XCircle className="h-4 w-4 mr-2" />
            Cancelados ({cancelledPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {sortedPendingPayments.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">¡Excelente!</h3>
                <p className="text-gray-400">No hay pagos pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedPendingPayments.map((payment) => {
                const resident = getResident(payment.residentId)
                const room = resident ? getRoom(resident.roomId) : null
                const isOverdue = new Date(payment.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

                return (
                  <Card
                    key={payment.id}
                    className={`bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200 ${
                      isOverdue ? "border-red-500/30 bg-red-900/10" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getMethodIcon(payment.method)}
                          <div>
                            <h3 className="font-semibold text-white">
                              {resident?.firstName} {resident?.lastName}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {room?.number !== "N/A" ? `Hab. ${room?.number}` : "Sin habitación"} •{" "}
                              {getPaymentTypeLabel(payment.type)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${isOverdue ? "text-red-400" : "text-yellow-400"}`}>
                            {formatCurrency(payment.amount)}
                          </div>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Vencido
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <span>Fecha: {new Date(payment.date).toLocaleDateString("es-AR")}</span>
                        <Badge variant="outline" className={getPaymentTypeColor(payment.type)}>
                          {getPaymentTypeLabel(payment.type)}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSelectPayment(payment)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Procesar
                        </Button>
                        <Button
                          onClick={() => handleCancelPayment(payment)}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPayments.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Receipt className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No hay pagos completados</h3>
                <p className="text-gray-400">Los pagos procesados aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedPayments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((payment) => {
                  const resident = getResident(payment.residentId)
                  const room = resident ? getRoom(resident.roomId) : null
                  const daysAgo = Math.floor(
                    (new Date().getTime() - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24),
                  )

                  return (
                    <Card
                      key={payment.id}
                      className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getMethodIcon(payment.method)}
                            <div>
                              <h3 className="font-semibold text-white">
                                {resident?.firstName} {resident?.lastName}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {room?.number !== "N/A" ? `Hab. ${room?.number}` : "Sin habitación"} •{" "}
                                {daysAgo === 0 ? "Hoy" : `${daysAgo}d atrás`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-400">{formatCurrency(payment.amount)}</div>
                            {getStatusIcon(payment.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                          <span>Método: {payment.method === "cash" ? "Efectivo" : "Transferencia"}</span>
                          <Badge variant="outline" className={getPaymentTypeColor(payment.type)}>
                            {getPaymentTypeLabel(payment.type)}
                          </Badge>
                        </div>

                        {payment.receiptNumber && (
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <span>Recibo: {payment.receiptNumber}</span>
                          </div>
                        )}

                        <Button
                          onClick={() => handleCancelPayment(payment)}
                          variant="outline"
                          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Anular Pago
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledPayments.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <XCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No hay pagos cancelados</h3>
                <p className="text-gray-400">Los pagos anulados aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cancelledPayments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((payment) => {
                  const resident = getResident(payment.residentId)
                  const room = resident ? getRoom(resident.roomId) : null

                  return (
                    <Card key={payment.id} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm opacity-75">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getMethodIcon(payment.method)}
                            <div>
                              <h3 className="font-semibold text-white line-through">
                                {resident?.firstName} {resident?.lastName}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {room?.number !== "N/A" ? `Hab. ${room?.number}` : "Sin habitación"} •{" "}
                                {getPaymentTypeLabel(payment.type)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-400 line-through">
                              {formatCurrency(payment.amount)}
                            </div>
                            <Badge variant="destructive" className="text-xs mt-1">
                              Anulado
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Anulado: {new Date(payment.date).toLocaleDateString("es-AR")}</span>
                          <Badge variant="outline" className="text-gray-500 border-gray-500">
                            {getPaymentTypeLabel(payment.type)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Payment Dialog mejorado */}
      <Dialog open={isNewPayment} onOpenChange={setIsNewPayment}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Nuevo Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="resident" className="text-gray-300">
                Residente
              </Label>
              <Select
                value={newPaymentForm.residentId}
                onValueChange={(value) => setNewPaymentForm((prev) => ({ ...prev, residentId: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
                  <SelectValue placeholder="Seleccionar residente" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {availableResidents.map((resident) => {
                    const room = getRoom(resident.roomId)
                    return (
                      <SelectItem key={resident.id} value={resident.id}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {resident.firstName} {resident.lastName}
                            {room?.number && room.number !== "N/A" && ` - Hab. ${room.number}`}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentType" className="text-gray-300">
                Concepto
              </Label>
              <Select
                value={newPaymentForm.type}
                onValueChange={(value: "monthly_rent" | "matricula" | "deposit") =>
                  setNewPaymentForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="deposit">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span>Depósito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="matricula">
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4 text-purple-400" />
                      <span>Matrícula</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly_rent">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span>Mensualidad</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount" className="text-gray-300">
                Monto (ARS)
              </Label>
              <Input
                id="amount"
                type="number"
                value={newPaymentForm.amount}
                onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="bg-gray-700 border-gray-600 mt-2"
                placeholder="Ingrese el monto"
              />
            </div>

            <div>
              <Label htmlFor="method" className="text-gray-300">
                Método de pago
              </Label>
              <Select
                value={newPaymentForm.method}
                onValueChange={(value: "cash" | "transfer") =>
                  setNewPaymentForm((prev) => ({ ...prev, method: value }))
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="cash">
                    <div className="flex items-center space-x-2">
                      <Banknote className="h-4 w-4 text-green-400" />
                      <span>Efectivo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-blue-400" />
                      <span>Transferencia</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-300">
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                value={newPaymentForm.notes}
                onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="bg-gray-700 border-gray-600 mt-2"
                placeholder="Notas adicionales"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
              onClick={() => setIsNewPayment(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleNewPayment("pending")}
              disabled={!newPaymentForm.residentId || !newPaymentForm.amount}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Pendiente
            </Button>
            <Button
              onClick={() => handleNewPayment("completed")}
              disabled={!newPaymentForm.residentId || !newPaymentForm.amount}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Procesar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog mejorado */}
      <Dialog open={isProcessingPayment} onOpenChange={setIsProcessingPayment}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Procesar Pago
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <Card className="bg-gray-700/50 border-gray-600/50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 text-white">
                    {getResident(selectedPayment.residentId)?.firstName}{" "}
                    {getResident(selectedPayment.residentId)?.lastName}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Concepto:</span>
                      <span className="text-white">{getPaymentTypeLabel(selectedPayment.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monto total:</span>
                      <span className="font-bold text-white">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="paymentAmount" className="text-gray-300">
                  Monto a cobrar
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 mt-2"
                  max={selectedPayment.amount}
                />
                <p className="text-xs text-gray-400 mt-1">Máximo: {formatCurrency(selectedPayment.amount)}</p>
              </div>

              <div>
                <Label htmlFor="paymentMethod" className="text-gray-300">
                  Método de pago
                </Label>
                <Select value={paymentMethod} onValueChange={(value: "cash" | "transfer") => setPaymentMethod(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="cash">
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4 text-green-400" />
                        <span>Efectivo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                        <span>Transferencia</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountType" className="text-gray-300">
                  Descuento
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(value: "none" | "percentage" | "fixed") => setDiscountType(value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="none">Sin descuento</SelectItem>
                    <SelectItem value="percentage">
                      <div className="flex items-center space-x-2">
                        <Percent className="h-4 w-4" />
                        <span>Porcentaje (%)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountType !== "none" && (
                <div>
                  <Label htmlFor="discountValue" className="text-gray-300">
                    {discountType === "percentage" ? "Porcentaje de descuento" : "Monto de descuento"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="discountValue"
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="bg-gray-700 border-gray-600 mt-2"
                      placeholder={discountType === "percentage" ? "10" : "5000"}
                    />
                    {discountType === "percentage" && (
                      <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              )}

              {paymentAmount && Number(paymentAmount) < selectedPayment.amount && (
                <Card className="bg-yellow-900/20 border-yellow-600/50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <p className="text-yellow-400 text-sm">
                        Pago parcial: Se generará un nuevo pago pendiente por{" "}
                        {formatCurrency(selectedPayment.amount - Number(paymentAmount))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
              onClick={() => setIsProcessingPayment(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={
                !paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > (selectedPayment?.amount || 0)
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Procesar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
