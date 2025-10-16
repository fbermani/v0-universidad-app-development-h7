"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from "@/context/AppContext"
import { Save, Plus, Trash2, Edit } from "lucide-react"
import type { Room } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ConnectionStatus } from "./ConnectionStatus"

const roomTypes = [
  { value: "individual", label: "Individual", capacity: 1 },
  { value: "double", label: "Doble", capacity: 2 },
  { value: "triple", label: "Triple", capacity: 3 },
  { value: "quadruple", label: "Cuádruple", capacity: 4 },
  { value: "quintuple", label: "Quíntuple", capacity: 5 },
] as const

export default function Settings() {
  const { state, dispatch } = useAppContext()
  const [exchangeRate, setExchangeRate] = useState(state.configuration.exchangeRate)
  const [roomRates, setRoomRates] = useState(state.configuration.roomRates)
  const [manualRatesARS, setManualRatesARS] = useState(state.configuration.roomRatesARS)
  const [useManualRates, setUseManualRates] = useState(false)

  // Estado para gestión de habitaciones
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [newRoom, setNewRoom] = useState({
    number: "",
    type: "individual" as Room["type"],
    gender: "male" as "male" | "female",
  })

  const handleSaveConfiguration = () => {
    const calculatedRatesARS = {
      individual: Math.round(roomRates.individual * exchangeRate),
      double: Math.round(roomRates.double * exchangeRate),
      triple: Math.round(roomRates.triple * exchangeRate),
      quadruple: Math.round(roomRates.quadruple * exchangeRate),
      quintuple: Math.round(roomRates.quintuple * exchangeRate),
    }

    const finalRatesARS = useManualRates ? manualRatesARS : calculatedRatesARS

    dispatch({
      type: "UPDATE_CONFIGURATION",
      payload: {
        ...state.configuration,
        exchangeRate,
        roomRates,
        roomRatesARS: finalRatesARS,
        lastUpdated: new Date().toISOString(),
      },
    })
  }

  const handleSaveMonthlyRates = () => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    dispatch({
      type: "SAVE_MONTHLY_RATES",
      payload: {
        month,
        userId: state.user?.id || "unknown",
      },
    })
  }

  const handleAddRoom = () => {
    if (!newRoom.number) return

    const roomType = roomTypes.find((rt) => rt.value === newRoom.type)
    if (!roomType) return

    const room: Room = {
      id: `room-${Date.now()}`,
      number: newRoom.number,
      type: newRoom.type,
      capacity: roomType.capacity,
      currentOccupancy: 0,
      status: "available",
      monthlyRate: roomRates[newRoom.type],
      gender: newRoom.gender,
    }

    dispatch({ type: "ADD_ROOM", payload: room })
    setNewRoom({ number: "", type: "individual", gender: "male" })
    setIsAddRoomOpen(false)
  }

  const handleEditRoom = () => {
    if (!editingRoom) return

    const roomType = roomTypes.find((rt) => rt.value === editingRoom.type)
    if (!roomType) return

    const updatedRoom: Room = {
      ...editingRoom,
      capacity: roomType.capacity,
    }

    dispatch({ type: "UPDATE_ROOM", payload: updatedRoom })
    setEditingRoom(null)
    setIsEditRoomOpen(false)
  }

  const handleDeleteRoom = (roomId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta habitación?")) {
      dispatch({ type: "DELETE_ROOM", payload: roomId })
    }
  }

  const openEditDialog = (room: Room) => {
    setEditingRoom({ ...room })
    setIsEditRoomOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Gestiona las tarifas, habitaciones y configuración general</p>
      </div>

      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rates">Tarifas</TabsTrigger>
          <TabsTrigger value="rooms">Habitaciones</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
        </TabsList>

        {/* Tab de Tarifas */}
        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Cambio</CardTitle>
              <CardDescription>Configura el tipo de cambio USD a ARS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Tipo de Cambio (USD a ARS)</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  placeholder="1300"
                />
                <p className="text-sm text-muted-foreground">
                  Última actualización: {new Date(state.configuration.lastUpdated).toLocaleString("es-AR")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarifas Mensuales por Tipo de Habitación</CardTitle>
              <CardDescription>Configura las tarifas base en USD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roomTypes.map((roomType) => (
                <div key={roomType.value} className="space-y-2">
                  <Label htmlFor={`rate-${roomType.value}`}>
                    {roomType.label} (Capacidad: {roomType.capacity})
                  </Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        id={`rate-${roomType.value}`}
                        type="number"
                        value={roomRates[roomType.value]}
                        onChange={(e) =>
                          setRoomRates({
                            ...roomRates,
                            [roomType.value]: Number(e.target.value),
                          })
                        }
                        placeholder="USD"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">USD {roomRates[roomType.value]}</p>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={
                          useManualRates
                            ? manualRatesARS[roomType.value]
                            : Math.round(roomRates[roomType.value] * exchangeRate)
                        }
                        onChange={(e) => {
                          setUseManualRates(true)
                          setManualRatesARS({
                            ...manualRatesARS,
                            [roomType.value]: Number(e.target.value),
                          })
                        }}
                        placeholder="ARS"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        ARS{" "}
                        {useManualRates
                          ? manualRatesARS[roomType.value].toLocaleString("es-AR")
                          : Math.round(roomRates[roomType.value] * exchangeRate).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveConfiguration} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </Button>
                <Button onClick={handleSaveMonthlyRates} variant="outline" className="flex-1 bg-transparent">
                  Guardar Mes Actual
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Habitaciones */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Habitaciones</CardTitle>
                  <CardDescription>Administra las habitaciones disponibles</CardDescription>
                </div>
                <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Habitación
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nueva Habitación</DialogTitle>
                      <DialogDescription>Agrega una nueva habitación al sistema</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-number">Número de Habitación</Label>
                        <Input
                          id="room-number"
                          value={newRoom.number}
                          onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                          placeholder="Ej: 101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-type">Tipo de Habitación</Label>
                        <Select
                          value={newRoom.type}
                          onValueChange={(value: Room["type"]) => setNewRoom({ ...newRoom, type: value })}
                        >
                          <SelectTrigger id="room-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roomTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label} (Capacidad: {type.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-gender">Género de Habitación</Label>
                        <Select
                          value={newRoom.gender}
                          onValueChange={(value: "male" | "female") => setNewRoom({ ...newRoom, gender: value })}
                        >
                          <SelectTrigger id="room-gender">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Masculina</SelectItem>
                            <SelectItem value="female">Femenina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddRoom}>Agregar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.rooms.length === 0 ? (
                  <p className="text-center text-muted-foreground">No hay habitaciones registradas</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {state.rooms.map((room) => (
                      <Card key={room.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Habitación {room.number}</CardTitle>
                            <Badge
                              variant="outline"
                              className={
                                room.gender === "male"
                                  ? "text-blue-400 border-blue-400"
                                  : "text-pink-400 border-pink-400"
                              }
                            >
                              {room.gender === "male" ? "M" : "F"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-sm">
                            <p className="text-muted-foreground">
                              Tipo:{" "}
                              <span className="font-medium text-foreground">
                                {roomTypes.find((rt) => rt.value === room.type)?.label}
                              </span>
                            </p>
                            <p className="text-muted-foreground">
                              Capacidad: <span className="font-medium text-foreground">{room.capacity} plazas</span>
                            </p>
                            <p className="text-muted-foreground">
                              Tarifa: <span className="font-medium text-foreground">USD {room.monthlyRate}</span>
                            </p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-transparent"
                              onClick={() => openEditDialog(room)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Base de Datos */}
        <TabsContent value="database" className="space-y-4">
          <ConnectionStatus />
        </TabsContent>
      </Tabs>

      {/* Dialog de Edición */}
      <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Habitación {editingRoom?.number}</DialogTitle>
            <DialogDescription>Modifica los detalles de la habitación</DialogDescription>
          </DialogHeader>
          {editingRoom && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-room-number">Número de Habitación</Label>
                <Input
                  id="edit-room-number"
                  value={editingRoom.number}
                  onChange={(e) => setEditingRoom({ ...editingRoom, number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room-type">Tipo de Habitación</Label>
                <Select
                  value={editingRoom.type}
                  onValueChange={(value: Room["type"]) => setEditingRoom({ ...editingRoom, type: value })}
                >
                  <SelectTrigger id="edit-room-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} (Capacidad: {type.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  La capacidad se actualizará automáticamente a{" "}
                  {roomTypes.find((rt) => rt.value === editingRoom.type)?.capacity} plazas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room-rate">Tarifa Mensual (USD)</Label>
                <Input
                  id="edit-room-rate"
                  type="number"
                  value={editingRoom.monthlyRate}
                  onChange={(e) => setEditingRoom({ ...editingRoom, monthlyRate: Number(e.target.value) })}
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room-gender">Género de Habitación</Label>
                <Select
                  value={editingRoom.gender || "male"}
                  onValueChange={(value: "male" | "female") => setEditingRoom({ ...editingRoom, gender: value })}
                >
                  <SelectTrigger id="edit-room-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculina</SelectItem>
                    <SelectItem value="female">Femenina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoomOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditRoom}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
