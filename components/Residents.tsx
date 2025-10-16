"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, AlertTriangle, ChevronDown, ChevronUp, UserPlus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useApp } from "../context/AppContext"
import type { Resident, BehaviorNote } from "../types"
import { LogoFull } from "@/components/Logo"
import { NationalityFlag, countries } from "./NationalityFlag"

export default function Residents() {
  const { state, dispatch } = useApp()

  /* ---------- local state ---------- */
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [isAddingBehaviorNote, setIsAddingBehaviorNote] = useState(false)
  const [isEditingResident, setIsEditingResident] = useState(false)
  const [isChangingRoom, setIsChangingRoom] = useState(false)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [isAddingResident, setIsAddingResident] = useState(false)
  const [checkOutDate, setCheckOutDate] = useState("")
  const [editingResident, setEditingResident] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  })
  const [newResident, setNewResident] = useState({
    firstName: "",
    lastName: "",
    nationality: "argentina" as const,
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    roomId: "",
  })
  const [newRoomId, setNewRoomId] = useState("")
  const [documentName, setDocumentName] = useState("")
  const [newBehaviorNote, setNewBehaviorNote] = useState({
    type: "verbal" as "verbal" | "written",
    description: "",
    severity: "low" as "low" | "medium" | "high",
  })
  const [activeTab, setActiveTab] = useState("active")
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  /* ---------- selectors & helpers ---------- */
  const filteredResidents = state.residents
    .filter((r) => {
      // Exclude the general income resident from the list
      if (r.id === "general-income") return false

      const matchesSearch =
        r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())

      if (activeTab === "active") {
        return matchesSearch && r.status === "active"
      } else {
        return matchesSearch && r.status === "inactive"
      }
    })
    .sort((a, b) => {
      const roomA = state.rooms.find((room) => room.id === a.roomId)
      const roomB = state.rooms.find((room) => room.id === b.roomId)
      return Number(roomA?.number || 0) - Number(roomB?.number || 0)
    })

  const availableRooms = state.rooms.filter((room) => room.currentOccupancy < room.capacity)

  const formatARS = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount)

  const toggleCardExpansion = (residentId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [residentId]: !prev[residentId],
    }))
  }

  // Effect to open resident details dialog if selected from another component (e.g., Rooms)
  useEffect(() => {
    if (state.selectedResidentIdForDetails) {
      const resident = state.residents.find((r) => r.id === state.selectedResidentIdForDetails)
      if (resident) {
        setSelectedResident(resident)
        // Optionally expand the card if it's not already
        setExpandedCards((prev) => ({ ...prev, [resident.id]: true }))
      }
      // Clear the global state after processing
      dispatch({ type: "SET_SELECTED_RESIDENT_FOR_DETAILS", payload: null })
    }
  }, [state.selectedResidentIdForDetails, state.residents, dispatch])

  /* ---------- CRUD handlers ---------- */
  const handleAddResident = () => {
    if (!newResident.firstName || !newResident.lastName || !newResident.roomId) return

    const resident: Resident = {
      id: Date.now().toString(),
      firstName: newResident.firstName,
      lastName: newResident.lastName,
      nationality: newResident.nationality,
      email: newResident.email,
      phone: newResident.phone,
      emergencyContact: {
        name: newResident.emergencyContactName,
        phone: newResident.emergencyContactPhone,
        relationship: newResident.emergencyContactRelationship,
      },
      roomId: newResident.roomId,
      checkInDate: new Date().toISOString(),
      status: "active",
      behaviorNotes: [],
      documents: [],
    }

    dispatch({ type: "ADD_RESIDENT", payload: resident })
    setNewResident({
      firstName: "",
      lastName: "",
      nationality: "argentina",
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      roomId: "",
    })
    setIsAddingResident(false)
  }

  const handleAddBehaviorNote = () => {
    if (!selectedResident || !newBehaviorNote.description) return

    const note: BehaviorNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...newBehaviorNote,
      createdBy: state.user?.name || "Admin",
    }

    const updated = { ...selectedResident, behaviorNotes: [...selectedResident.behaviorNotes, note] }
    dispatch({ type: "UPDATE_RESIDENT", payload: updated })
    setNewBehaviorNote({ type: "verbal", description: "", severity: "low" })
    setIsAddingBehaviorNote(false)
    setSelectedResident(updated)
  }

  const handleSaveEdit = () => {
    if (!selectedResident) return
    const updated = {
      ...selectedResident,
      firstName: editingResident.firstName,
      lastName: editingResident.lastName,
      email: editingResident.email,
      phone: editingResident.phone,
      emergencyContact: {
        name: editingResident.emergencyContactName,
        phone: editingResident.emergencyContactPhone,
        relationship: editingResident.emergencyContactRelationship,
      },
    }
    dispatch({ type: "UPDATE_RESIDENT", payload: updated })
    setIsEditingResident(false)
    setSelectedResident(updated)
  }

  const handleCheckOut = (residentId: string) => {
    const resident = state.residents.find((r) => r.id === residentId)
    if (!resident) return

    const confirmMessage = `¿Estás seguro de que quieres hacer check-out de ${resident.firstName} ${resident.lastName}?`

    if (confirm(confirmMessage)) {
      const updatedResident: Resident = {
        ...resident,
        status: "inactive",
        checkOutDate: new Date().toISOString(),
      }

      dispatch({ type: "UPDATE_RESIDENT", payload: updatedResident })

      // Close any open dialogs
      setSelectedResident(null)

      // Show success message (you could use a toast here)
      console.log(`Check-out completado para ${resident.firstName} ${resident.lastName}`)
    }
  }

  const handleExpulsion = (residentId: string) => {
    const resident = state.residents.find((r) => r.id === residentId)
    if (!resident) return

    const reason = prompt(`Motivo de la expulsión de ${resident.firstName} ${resident.lastName}:`)

    if (reason && reason.trim()) {
      const confirmMessage = `¿Estás seguro de que quieres expulsar a ${resident.firstName} ${resident.lastName}?\n\nMotivo: ${reason}`

      if (confirm(confirmMessage)) {
        const expulsionNote: BehaviorNote = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: "written",
          description: `EXPULSIÓN: ${reason}`,
          severity: "high",
          createdBy: state.user?.name || "Sistema",
        }

        const updatedResident: Resident = {
          ...resident,
          status: "inactive",
          checkOutDate: new Date().toISOString(),
          behaviorNotes: [...resident.behaviorNotes, expulsionNote],
        }

        dispatch({ type: "UPDATE_RESIDENT", payload: updatedResident })

        // Close any open dialogs
        setSelectedResident(null)

        // Show success message (you could use a toast here)
        console.log(`Expulsión completada para ${resident.firstName} ${resident.lastName}`)
      }
    } else if (reason !== null) {
      // User clicked OK but didn't enter a reason
      alert("Debe proporcionar un motivo para la expulsión.")
    }
  }

  const handleRoomChange = (resident: Resident) => {
    setSelectedResident(resident)
    setNewRoomId("")
    setCheckOutDate("")
    setIsChangingRoom(true)
  }

  const handleConfirmRoomChange = () => {
    if (!selectedResident || !newRoomId || !checkOutDate) return

    const updatedResident = {
      ...selectedResident,
      roomId: newRoomId,
    }

    dispatch({ type: "UPDATE_RESIDENT", payload: updatedResident })
    setIsChangingRoom(false)
    setSelectedResident(updatedResident)
  }

  const handleUploadDocument = () => {
    if (!selectedResident || !documentName) return

    const newDocument = {
      id: Date.now().toString(),
      name: documentName,
      type: "pdf",
      url: "#",
      uploadDate: new Date().toISOString(),
    }

    const updatedResident = {
      ...selectedResident,
      documents: [...selectedResident.documents, newDocument],
    }

    dispatch({ type: "UPDATE_RESIDENT", payload: updatedResident })
    setDocumentName("")
    setIsUploadingDocument(false)
    setSelectedResident(updatedResident)
  }

  const handleEditResident = (resident: Resident) => {
    setSelectedResident(resident)
    setEditingResident({
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email,
      phone: resident.phone,
      emergencyContactName: resident.emergencyContact.name,
      emergencyContactPhone: resident.emergencyContact.phone,
      emergencyContactRelationship: resident.emergencyContact.relationship,
    })
    setIsEditingResident(true)
  }

  /* ---------- UI ---------- */
  return (
    <div className="p-6">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <LogoFull className="h-8" />
          <h2 className="text-2xl font-bold text-white">Residentes</h2>
        </div>

        {/* Add New Resident Button */}
        <Dialog open={isAddingResident} onOpenChange={setIsAddingResident}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Residente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Agregar Nuevo Residente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newFirstName" className="text-gray-200">
                  Nombre
                </Label>
                <Input
                  id="newFirstName"
                  value={newResident.firstName}
                  onChange={(e) => setNewResident({ ...newResident, firstName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="newLastName" className="text-gray-200">
                  Apellido
                </Label>
                <Input
                  id="newLastName"
                  value={newResident.lastName}
                  onChange={(e) => setNewResident({ ...newResident, lastName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="newNationality" className="text-gray-200">
                  Nacionalidad
                </Label>
                <Select
                  value={newResident.nationality}
                  onValueChange={(value: any) => setNewResident({ ...newResident, nationality: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value} className="text-white">
                        <div className="flex items-center gap-2">
                          <NationalityFlag nationality={country.value} className="h-4 w-4" />
                          <span>{country.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newRoom" className="text-gray-200">
                  Habitación
                </Label>
                <Select
                  value={newResident.roomId}
                  onValueChange={(value) => setNewResident({ ...newResident, roomId: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Seleccionar habitación" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id} className="text-white">
                        Hab. {room.number} - {room.capacity - room.currentOccupancy} plazas disponibles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newEmail" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newResident.email}
                  onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="newPhone" className="text-gray-200">
                  Teléfono
                </Label>
                <Input
                  id="newPhone"
                  value={newResident.phone}
                  onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="newEmergencyName" className="text-gray-200">
                  Contacto de Emergencia
                </Label>
                <Input
                  id="newEmergencyName"
                  value={newResident.emergencyContactName}
                  onChange={(e) => setNewResident({ ...newResident, emergencyContactName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="newEmergencyPhone" className="text-gray-200">
                  Teléfono de Emergencia
                </Label>
                <Input
                  id="newEmergencyPhone"
                  value={newResident.emergencyContactPhone}
                  onChange={(e) => setNewResident({ ...newResident, emergencyContactPhone: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="newEmergencyRelationship" className="text-gray-200">
                  Relación
                </Label>
                <Input
                  id="newEmergencyRelationship"
                  value={newResident.emergencyContactRelationship}
                  onChange={(e) => setNewResident({ ...newResident, emergencyContactRelationship: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddingResident(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddResident}
                disabled={!newResident.firstName || !newResident.lastName || !newResident.roomId}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600"
              >
                Agregar Residente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar…"
          className="pl-10 bg-gray-800 border-gray-700 text-sm text-white"
        />
      </div>

      {/* Tabs for Active/Inactive Residents */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-700">
          <TabsTrigger value="active" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
            Activos
          </TabsTrigger>
          <TabsTrigger value="inactive" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
            Inactivos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {/* Grid for Active Residents */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResidents.length === 0 && (
              <p className="text-gray-400 col-span-full text-center">No hay residentes activos.</p>
            )}
            {filteredResidents.map((r) => {
              const room = state.rooms.find((rm) => rm.id === r.roomId)
              const isExpanded = expandedCards[r.id]
              const verbalNotes = r.behaviorNotes.filter((note) => note.type === "verbal").length
              const writtenNotes = r.behaviorNotes.filter((note) => note.type === "written").length

              // Safe access to room rates with fallback
              const roomRate =
                room && state.configuration?.roomRatesARS?.[room.type] ? state.configuration.roomRatesARS[room.type] : 0

              return (
                <Card key={r.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          <NationalityFlag nationality={r.nationality} className="h-5 w-5" />
                          {r.firstName} {r.lastName}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          r.status === "active" ? "text-green-400 border-green-400" : "text-gray-400 border-gray-400"
                        }`}
                      >
                        {r.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 pt-0 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hab.:</span>
                      <span className="text-white">
                        {room?.number} ({room?.type})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tarifa:</span>
                      <span className="text-white">{formatARS(roomRate)}</span>
                    </div>

                    {isExpanded && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Check-in:</span>
                          <span className="text-white">{new Date(r.checkInDate).toLocaleDateString("es-AR")}</span>
                        </div>
                        {/* Always show "Salida" label, with "Pendiente" if no checkOutDate */}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Salida:</span>
                          <span className="text-white">
                            {r.checkOutDate ? new Date(r.checkOutDate).toLocaleDateString("es-AR") : "Pendiente"}
                          </span>
                        </div>
                        {(verbalNotes > 0 || writtenNotes > 0) && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Llamados atención:</span>
                            <div className="flex gap-2">
                              {verbalNotes > 0 && (
                                <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                                  {verbalNotes} verbal{verbalNotes > 1 ? "es" : ""}
                                </Badge>
                              )}
                              {writtenNotes > 0 && (
                                <Badge variant="outline" className="text-red-400 border-red-400 text-xs">
                                  {writtenNotes} escrit{writtenNotes > 1 ? "os" : "o"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* botones */}
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditResident(r)}
                              className="flex-1 h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRoomChange(r)}
                              className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white flex-1 h-8 text-xs"
                            >
                              Cambio Hab
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckOut(r.id)}
                              className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black flex-1 h-8 text-xs"
                            >
                              Check Out
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExpulsion(r.id)}
                              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white flex-1 h-8 text-xs"
                            >
                              Expulsión
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardExpansion(r.id)}
                        className="text-gray-400 hover:text-white p-0 h-auto"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          {/* Grid for Inactive Residents */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResidents.length === 0 && (
              <p className="text-gray-400 col-span-full text-center">No hay residentes inactivos.</p>
            )}
            {filteredResidents.map((r) => {
              const room = state.rooms.find((rm) => rm.id === r.roomId)
              const isExpanded = expandedCards[r.id]
              const verbalNotes = r.behaviorNotes.filter((note) => note.type === "verbal").length
              const writtenNotes = r.behaviorNotes.filter((note) => note.type === "written").length
              const isExpelled = r.behaviorNotes.some(
                (note) => note.type === "written" && note.description.startsWith("EXPULSIÓN:"),
              )

              // Safe access to room rates with fallback
              const roomRate =
                room && state.configuration?.roomRatesARS?.[room.type] ? state.configuration.roomRatesARS[room.type] : 0

              return (
                <Card key={r.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          <NationalityFlag nationality={r.nationality} className="h-5 w-5" />
                          {r.firstName} {r.lastName}
                        </CardTitle>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            r.status === "active" ? "text-green-400 border-green-400" : "text-gray-400 border-gray-400"
                          }`}
                        >
                          {r.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                        {isExpelled && (
                          <Badge variant="destructive" className="text-xs bg-red-600 text-white">
                            Expulsado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 pt-0 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hab.:</span>
                      <span className="text-white">
                        {room?.number} ({room?.type})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tarifa:</span>
                      <span className="text-white">{formatARS(roomRate)}</span>
                    </div>

                    {isExpanded && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Check-in:</span>
                          <span className="text-white">{new Date(r.checkInDate).toLocaleDateString("es-AR")}</span>
                        </div>
                        {r.checkOutDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Salida:</span>
                            <span className="text-white">{new Date(r.checkOutDate).toLocaleDateString("es-AR")}</span>
                          </div>
                        )}
                        {(verbalNotes > 0 || writtenNotes > 0) && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Llamados atención:</span>
                            <div className="flex gap-2">
                              {verbalNotes > 0 && (
                                <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                                  {verbalNotes} verbal{verbalNotes > 1 ? "es" : ""}
                                </Badge>
                              )}
                              {writtenNotes > 0 && (
                                <Badge variant="outline" className="text-red-400 border-red-400 text-xs">
                                  {writtenNotes} escrit{writtenNotes > 1 ? "os" : "o"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* botones (deshabilitados para residentes inactivos) */}
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditResident(r)}
                              className="flex-1 h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRoomChange(r)}
                              className="text-gray-500 border-gray-600 flex-1 h-8 text-xs cursor-not-allowed opacity-50"
                              disabled={true}
                            >
                              Cambio Hab
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-500 border-gray-600 flex-1 h-8 text-xs cursor-not-allowed opacity-50 bg-transparent"
                              disabled={true}
                            >
                              Check Out
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-500 border-gray-600 flex-1 h-8 text-xs cursor-not-allowed opacity-50 bg-transparent"
                              disabled={true}
                            >
                              Expulsión
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardExpansion(r.id)}
                        className="text-gray-400 hover:text-white p-0 h-auto"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resident Details Dialog */}
      <Dialog open={!!selectedResident} onOpenChange={() => setSelectedResident(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
          <DialogHeader className="p-4 pb-2">
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                <NationalityFlag nationality={selectedResident?.nationality} className="h-6 w-6" />
                {selectedResident?.firstName} {selectedResident?.lastName}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditResident(selectedResident!)}
                  className="h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsUploadingDocument(true)}
                  className="h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Documento
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedResident && (
            <div className="grid grid-cols-2 gap-6 p-4 pt-0">
              <div>
                <h3 className="text-base font-semibold mb-3 text-white">Información Personal</h3>
                <div className="space-y-1.5 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2 text-white">{selectedResident.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Teléfono:</span>
                    <span className="ml-2 text-white">{selectedResident.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Contacto de emergencia:</span>
                    <span className="ml-2 text-white">
                      {selectedResident.emergencyContact.name} ({selectedResident.emergencyContact.relationship})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Teléfono de emergencia:</span>
                    <span className="ml-2 text-white">{selectedResident.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold text-white">Llamados de Atención</h3>
                  <Dialog open={isAddingBehaviorNote} onOpenChange={setIsAddingBehaviorNote}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Agregar Llamado de Atención</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="noteType" className="text-gray-200">
                            Tipo
                          </Label>
                          <Select
                            value={newBehaviorNote.type}
                            onValueChange={(value: "verbal" | "written") =>
                              setNewBehaviorNote({ ...newBehaviorNote, type: value })
                            }
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="verbal" className="text-white">
                                Verbal
                              </SelectItem>
                              <SelectItem value="written" className="text-white">
                                Escrito
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="noteSeverity" className="text-gray-200">
                            Severidad
                          </Label>
                          <Select
                            value={newBehaviorNote.severity}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setNewBehaviorNote({ ...newBehaviorNote, severity: value })
                            }
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="low" className="text-white">
                                Baja
                              </SelectItem>
                              <SelectItem value="medium" className="text-white">
                                Media
                              </SelectItem>
                              <SelectItem value="high" className="text-white">
                                Alta
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="noteDescription" className="text-gray-200">
                            Descripción
                          </Label>
                          <Textarea
                            id="noteDescription"
                            value={newBehaviorNote.description}
                            onChange={(e) => setNewBehaviorNote({ ...newBehaviorNote, description: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingBehaviorNote(false)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAddBehaviorNote}
                          disabled={!newBehaviorNote.description}
                          className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600"
                        >
                          Agregar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedResident.behaviorNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-700 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className={
                            note.type === "written"
                              ? "text-red-400 border-red-400"
                              : "text-yellow-400 border-yellow-400"
                          }
                        >
                          {note.type === "written" ? "Escrito" : "Verbal"}
                        </Badge>
                        <span className="text-xs text-gray-400">{new Date(note.date).toLocaleDateString("es-AR")}</span>
                      </div>
                      <p className="text-sm text-white">{note.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Por: {note.createdBy}</p>
                    </div>
                  ))}
                  {selectedResident.behaviorNotes.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay llamados de atención registrados</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold mb-3 text-white">Documentos</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedResident?.documents.map((doc) => (
                    <div key={doc.id} className="p-2 bg-gray-700 rounded flex justify-between items-center">
                      <div>
                        <p className="text-sm text-white">{doc.name}</p>
                        <p className="text-xs text-gray-400">{new Date(doc.uploadDate).toLocaleDateString("es-AR")}</p>
                      </div>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {doc.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {selectedResident?.documents.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay documentos cargados</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Resident Dialog */}
      <Dialog open={isEditingResident} onOpenChange={setIsEditingResident}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Residente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editFirstName" className="text-gray-200">
                Nombre
              </Label>
              <Input
                id="editFirstName"
                value={editingResident.firstName}
                onChange={(e) => setEditingResident({ ...editingResident, firstName: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editLastName" className="text-gray-200">
                Apellido
              </Label>
              <Input
                id="editLastName"
                value={editingResident.lastName}
                onChange={(e) => setEditingResident({ ...editingResident, lastName: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editEmail" className="text-gray-200">
                Email
              </Label>
              <Input
                id="editEmail"
                value={editingResident.email}
                onChange={(e) => setEditingResident({ ...editingResident, email: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editPhone" className="text-gray-200">
                Teléfono
              </Label>
              <Input
                id="editPhone"
                value={editingResident.phone}
                onChange={(e) => setEditingResident({ ...editingResident, phone: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editEmergencyName" className="text-gray-200">
                Contacto de Emergencia
              </Label>
              <Input
                id="editEmergencyName"
                value={editingResident.emergencyContactName}
                onChange={(e) => setEditingResident({ ...editingResident, emergencyContactName: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editEmergencyPhone" className="text-gray-200">
                Teléfono de Emergencia
              </Label>
              <Input
                id="editEmergencyPhone"
                value={editingResident.emergencyContactPhone}
                onChange={(e) => setEditingResident({ ...editingResident, emergencyContactPhone: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="editEmergencyRelationship" className="text-gray-200">
                Relación
              </Label>
              <Input
                id="editEmergencyRelationship"
                value={editingResident.emergencyContactRelationship}
                onChange={(e) =>
                  setEditingResident({ ...editingResident, emergencyContactRelationship: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditingResident(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Change Dialog */}
      <Dialog open={isChangingRoom} onOpenChange={setIsChangingRoom}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Cambio de Habitación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="checkOutDate" className="text-gray-200">
                Fecha de Salida
              </Label>
              <Input
                id="checkOutDate"
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="newRoom" className="text-gray-200">
                Nueva Habitación
              </Label>
              <Select value={newRoomId} onValueChange={setNewRoomId}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Seleccionar habitación" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id} className="text-white">
                      Hab. {room.number} - {room.capacity - room.currentOccupancy} plazas disponibles
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsChangingRoom(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRoomChange}
              disabled={!newRoomId || !checkOutDate}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600"
            >
              Confirmar Cambio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadingDocument} onOpenChange={setIsUploadingDocument}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Cargar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentName" className="text-gray-200">
                Nombre del Documento
              </Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="ej: DNI, Certificado médico..."
              />
            </div>
            <div className="p-4 border-2 border-dashed border-gray-600 rounded text-center">
              <p className="text-gray-400">Arrastra el archivo aquí o haz clic para seleccionar</p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 5MB)</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsUploadingDocument(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={!documentName}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600"
            >
              Cargar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
