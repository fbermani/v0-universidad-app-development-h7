"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { BedDouble, Users, DollarSign } from "lucide-react"
import { useApp } from "../context/AppContext"
import type { Room } from "../types"
import { LogoFull } from "@/components/Logo"
import { NationalityFlag } from "./NationalityFlag"

export default function Rooms() {
  const { state, dispatch } = useApp()
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false)
  const [newRoomForm, setNewRoomForm] = useState({
    number: "",
    type: "individual" as Room["type"],
    capacity: 1,
    monthlyRate: 0,
    gender: "male" as "male" | "female",
  })

  const roomTypes: { value: Room["type"]; label: string }[] = [
    { value: "individual", label: "Individual" },
    { value: "double", label: "Doble" },
    { value: "triple", label: "Triple" },
    { value: "quadruple", label: "Cuádruple" },
    { value: "quintuple", label: "Quíntuple" },
  ]

  const handleAddRoom = () => {
    if (!newRoomForm.number || !newRoomForm.type || newRoomForm.capacity <= 0 || newRoomForm.monthlyRate <= 0) {
      alert("Por favor, complete todos los campos y asegúrese de que los valores sean válidos.")
      return
    }

    const newRoom: Room = {
      id: Date.now().toString(),
      number: newRoomForm.number,
      type: newRoomForm.type,
      capacity: newRoomForm.capacity,
      currentOccupancy: 0,
      status: "available",
      monthlyRate: newRoomForm.monthlyRate,
      gender: newRoomForm.gender,
    }
    dispatch({ type: "ADD_ROOM", payload: newRoom })
    setIsAddRoomDialogOpen(false)
    setNewRoomForm({ number: "", type: "individual", capacity: 1, monthlyRate: 0, gender: "male" })
  }

  const getResidentsInRoom = (roomId: string) => {
    return state.residents.filter((resident) => resident.roomId === roomId && resident.status === "active")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleResidentClick = (residentId: string) => {
    dispatch({ type: "SET_SELECTED_RESIDENT_FOR_DETAILS", payload: residentId })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <LogoFull />
          <div>
            <h2 className="text-3xl font-bold text-white">Habitaciones</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {state.rooms.map((room) => {
          const residentsInRoom = getResidentsInRoom(room.id)
          const isFull = room.currentOccupancy >= room.capacity
          const isAvailable = room.status === "available"
          const isMaintenance = room.status === "maintenance"

          return (
            <Card key={room.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white text-lg">Hab {room.number}</CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      isMaintenance
                        ? "text-orange-400 border-orange-400"
                        : isFull
                          ? "text-red-400 border-red-400"
                          : isAvailable
                            ? "text-green-400 border-green-400"
                            : "text-blue-400 border-blue-400"
                    }`}
                  >
                    {isMaintenance ? "Mantenimiento" : isFull ? "Completa" : isAvailable ? "Disponible" : "Ocupada"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-gray-400 text-sm">
                  <div className="flex items-center">
                    <BedDouble className="h-4 w-4 mr-1" />
                    {room.type.charAt(0).toUpperCase() + room.type.slice(1)} ({room.capacity} plazas)
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      room.gender === "male" ? "text-blue-400 border-blue-400" : "text-pink-400 border-pink-400"
                    }`}
                  >
                    {room.gender === "male" ? "M" : "F"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-400" />
                    Ocupación:
                  </div>
                  <span>
                    {room.currentOccupancy}/{room.capacity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-400" />
                    Tarifa Mensual:
                  </div>
                  <span>{formatCurrency(room.monthlyRate)}</span>
                </div>

                {residentsInRoom.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-700">
                    <h4 className="text-white text-sm font-medium">Residentes:</h4>
                    {residentsInRoom.map((resident) => {
                      return (
                        <div key={resident.id} className="flex items-center gap-2 text-sm">
                          <NationalityFlag nationality={resident.nationality} className="h-5 w-5 flex-shrink-0" />
                          <span
                            className="text-gray-300 hover:text-blue-400 cursor-pointer truncate flex-1"
                            onClick={() => handleResidentClick(resident.id)}
                          >
                            {resident.firstName} {resident.lastName}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Nueva Habitación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomNumber">Número de Habitación</Label>
              <Input
                id="roomNumber"
                value={newRoomForm.number}
                onChange={(e) => setNewRoomForm({ ...newRoomForm, number: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="roomType">Tipo de Habitación</Label>
              <Select
                value={newRoomForm.type}
                onValueChange={(value: Room["type"]) => setNewRoomForm({ ...newRoomForm, type: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {roomTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="roomCapacity">Capacidad</Label>
              <Input
                id="roomCapacity"
                type="number"
                value={newRoomForm.capacity}
                onChange={(e) => setNewRoomForm({ ...newRoomForm, capacity: Number.parseInt(e.target.value) || 0 })}
                min={1}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="monthlyRate">Tarifa Mensual (USD)</Label>
              <Input
                id="monthlyRate"
                type="number"
                value={newRoomForm.monthlyRate}
                onChange={(e) =>
                  setNewRoomForm({ ...newRoomForm, monthlyRate: Number.parseFloat(e.target.value) || 0 })
                }
                min={0}
                step="0.01"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="roomGender">Género de Habitación</Label>
              <Select
                value={newRoomForm.gender}
                onValueChange={(value: "male" | "female") => setNewRoomForm({ ...newRoomForm, gender: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="male">Masculina</SelectItem>
                  <SelectItem value="female">Femenina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoomDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddRoom} className="bg-blue-600 hover:bg-blue-700">
              Agregar Habitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
