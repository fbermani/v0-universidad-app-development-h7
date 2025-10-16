"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, X, User } from "lucide-react"
import { useApp } from "../context/AppContext"
import type { Reservation, Resident } from "../types"
import { Textarea } from "@/components/ui/textarea"
import { LogoFull } from "@/components/Logo"
import NationalityFlag, { countries } from "@/components/NationalityFlag" // Import NationalityFlag and countries

export default function Reservations() {
  const { state, dispatch } = useApp()

  /* -------- local state -------- */
  const [isAddingReservation, setIsAddingReservation] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null)
  const [isCancellingReservation, setIsCancellingReservation] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const [newReservation, setNewReservation] = useState({
    firstName: "",
    lastName: "",
    nationality: "", // Added nationality
    // Removed email, phone, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, discountValue
    roomType: "",
    roomId: "",
    startDate: "",
    endDate: "",
    matriculaAmount: 0,
  })

  /* -------- helpers -------- */
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)

  const getStatusColor = (status: Reservation["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 border-yellow-400"
      case "confirmed":
        return "text-green-400 border-green-400"
      case "cancelled":
        return "text-red-400 border-red-400"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const getStatusLabel = (status: Reservation["status"]) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "confirmed":
        return "Confirmada"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  const handleRoomTypeChange = (roomType: string) => setNewReservation({ ...newReservation, roomType, roomId: "" })

  const handleRoomChange = (roomId: string) => {
    const room = state.rooms.find((r) => r.id === roomId)
    if (room) {
      // Use the ARS rate from configuration
      const baseAmount = state.configuration.roomRatesARS[room.type] || 0
      setNewReservation({ ...newReservation, roomId, matriculaAmount: baseAmount })
    }
  }

  /* -------- CRUD: Reservations -------- */
  const handleAddReservation = () => {
    if (!newReservation.firstName || !newReservation.lastName || !newReservation.roomId || !newReservation.startDate)
      return

    const reservation: Reservation = {
      id: Date.now().toString(),
      residentId: `temp-${Date.now()}`,
      roomId: newReservation.roomId,
      startDate: newReservation.startDate,
      endDate: newReservation.endDate,
      status: "pending",
      matriculaAmount: Math.round(newReservation.matriculaAmount),
      // Removed discount
    }

    dispatch({ type: "ADD_RESERVATION", payload: reservation })

    const tempResident: Resident = {
      id: reservation.residentId,
      firstName: newReservation.firstName,
      lastName: newReservation.lastName,
      nationality: newReservation.nationality, // Added nationality
      email: "", // Set default empty
      phone: "", // Set default empty
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      roomId: reservation.roomId,
      checkInDate: reservation.startDate,
      status: "pending",
      behaviorNotes: [],
      documents: [],
    }

    dispatch({ type: "ADD_RESIDENT", payload: tempResident })
    setIsAddingReservation(false)
    setNewReservation({
      firstName: "",
      lastName: "",
      nationality: "", // Reset nationality
      roomType: "",
      roomId: "",
      startDate: "",
      endDate: "",
      matriculaAmount: 0,
    })
  }

  const handleCheckIn = (reservationId: string) => {
    const reservation = state.reservations.find((r) => r.id === reservationId)
    const resident = state.residents.find((r) => r.id === reservation?.residentId)
    if (!reservation || !resident) return

    const updatedResident = {
      ...resident,
      status: "active" as const,
      checkInDate: new Date().toISOString(),
    }
    dispatch({ type: "UPDATE_RESIDENT", payload: updatedResident })

    const room = state.rooms.find((r) => r.id === reservation.roomId)
    if (room) {
      const monthlyPayment = {
        id: `monthly-${Date.now()}-${updatedResident.id}`,
        residentId: updatedResident.id,
        amount: state.configuration.roomRatesARS[room.type] || 0, // Use ARS rate from config
        currency: "ARS" as const,
        method: "cash" as const,
        date: new Date().toISOString(),
        type: "monthly_rent" as const,
        status: "pending" as const,
      }
      dispatch({ type: "ADD_PAYMENT", payload: monthlyPayment })
    }

    dispatch({ type: "DELETE_RESERVATION", payload: reservationId })
  }

  const handleCancelReservation = (reservationId: string) => {
    const reservation = state.reservations.find((r) => r.id === reservationId)
    if (!reservation) return

    dispatch({ type: "DELETE_RESIDENT", payload: reservation.residentId })
    dispatch({ type: "DELETE_RESERVATION", payload: reservationId })
  }

  /* -------- derived data -------- */
  const getResident = (id: string) => state.residents.find((r) => r.id === id)
  const getRoom = (id: string) => state.rooms.find((r) => r.id === id)

  const getAvailableRooms = () => {
    if (!newReservation.startDate || !newReservation.endDate) return []

    return state.rooms.filter((room) => {
      // Verificar que no exceda la capacidad
      const conflictingReservations = state.reservations.filter((reservation) => {
        const resStartDate = new Date(reservation.startDate)
        const resEndDate = reservation.endDate ? new Date(reservation.endDate) : new Date("2099-12-31")
        const newStartDate = new Date(newReservation.startDate)
        const newEndDate = new Date(newReservation.endDate)

        return (
          reservation.roomId === room.id &&
          reservation.status !== "cancelled" &&
          ((newStartDate >= resStartDate && newStartDate <= resEndDate) ||
            (newEndDate >= resStartDate && newEndDate <= resEndDate) ||
            (newStartDate <= resStartDate && newEndDate >= resEndDate))
        )
      })

      const futureOccupancy = conflictingReservations.length
      return room.currentOccupancy + futureOccupancy < room.capacity
    })
  }

  /* -------- UI -------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <LogoFull />
          <div>
            <h2 className="text-3xl font-bold text-white">Reservas</h2>
          </div>
        </div>
        <Dialog open={isAddingReservation} onOpenChange={setIsAddingReservation}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={newReservation.firstName}
                  onChange={(e) => setNewReservation({ ...newReservation, firstName: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={newReservation.lastName}
                  onChange={(e) => setNewReservation({ ...newReservation, lastName: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Select
                  value={newReservation.nationality}
                  onValueChange={(value) => setNewReservation({ ...newReservation, nationality: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Seleccionar nacionalidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        <div className="flex items-center gap-2">
                          <NationalityFlag nationality={country} className="h-5 w-5" />
                          <span>{country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Removed Email, Phone, Emergency Contact fields, and Discount */}
              <div>
                <Label htmlFor="startDate">Fecha de Ingreso</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newReservation.startDate}
                  onChange={(e) => setNewReservation({ ...newReservation, startDate: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha de Salida</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newReservation.endDate}
                  onChange={(e) => setNewReservation({ ...newReservation, endDate: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                  min={newReservation.startDate}
                />
              </div>
              <div>
                <Label htmlFor="roomType">Tipo de Habitación</Label>
                <Select value={newReservation.roomType} onValueChange={handleRoomTypeChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="double">Doble</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="quadruple">Cuádruple</SelectItem>
                    <SelectItem value="quintuple">Quíntuple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newReservation.roomType && newReservation.startDate && newReservation.endDate && (
                <div>
                  <Label htmlFor="roomId">Habitación</Label>
                  <Select value={newReservation.roomId} onValueChange={handleRoomChange}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Seleccionar habitación" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {getAvailableRooms()
                        .filter((room) => room.type === newReservation.roomType)
                        .map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Hab. {room.number} - Disponible para las fechas seleccionadas
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newReservation.matriculaAmount > 0 && (
                <div className="col-span-2 p-4 bg-gray-700 rounded">
                  <div className="flex justify-between items-center">
                    <span>Tarifa Actual:</span>
                    <span>{formatCurrency(newReservation.matriculaAmount)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsAddingReservation(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddReservation}
                disabled={
                  !newReservation.firstName ||
                  !newReservation.lastName ||
                  !newReservation.roomId ||
                  !newReservation.startDate
                }
              >
                Crear Reserva
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reservation cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {state.reservations.map((reservation) => {
          const resident = getResident(reservation.residentId)
          const room = getRoom(reservation.roomId)
          return (
            <Card key={reservation.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {resident?.firstName} {resident?.lastName}
                      <NationalityFlag nationality={resident?.nationality} className="h-4 w-4" />
                    </CardTitle>
                    <p className="text-gray-400 text-sm">{resident?.email}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(reservation.status)}>
                    {getStatusLabel(reservation.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Habitación:</span>
                    <span className="text-white">
                      {room?.number} ({room?.type})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha ingreso:</span>
                    <span className="text-white">{new Date(reservation.startDate).toLocaleDateString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Matrícula:</span>
                    <span className="text-white">{formatCurrency(reservation.matriculaAmount)}</span>
                  </div>
                  {reservation.discount && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Descuento:</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        -{reservation.discount.value}
                        {reservation.discount.type === "percentage" ? "%" : " ARS"}
                      </Badge>
                    </div>
                  )}
                </div>

                {reservation.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleCheckIn(reservation.id)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Check-in
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      onClick={() => {
                        setReservationToCancel(reservation.id)
                        setIsCancellingReservation(true)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {state.reservations.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No hay reservas</h3>
          <p className="text-gray-500">Crea una nueva reserva para comenzar</p>
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog open={isCancellingReservation} onOpenChange={setIsCancellingReservation}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Motivo de la cancelación</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="bg-gray-700 border-gray-600"
                rows={3}
                placeholder="Ingresa el motivo..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsCancellingReservation(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason}
              onClick={() => {
                if (reservationToCancel) {
                  handleCancelReservation(reservationToCancel)
                  setCancelReason("")
                  setIsCancellingReservation(false)
                  setReservationToCancel(null)
                }
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
