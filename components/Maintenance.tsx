"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Wrench, Clock, CheckCircle, Trash2 } from "lucide-react"
import { useApp } from "../context/AppContext"
import type { MaintenanceTask } from "../types"
import { LogoText } from "@/components/Logo"

export default function Maintenance() {
  const { state, dispatch } = useApp()
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [newTask, setNewTask] = useState({
    area: "",
    description: "",
    priority: "medium" as MaintenanceTask["priority"],
    notes: "",
  })

  const pendingTasks = state.maintenanceTasks.filter((task) => task.status === "pending")
  const inProgressTasks = state.maintenanceTasks.filter((task) => task.status === "in_progress")
  const completedTasks = state.maintenanceTasks.filter((task) => task.status === "completed")

  const handleAddTask = () => {
    if (!newTask.area || !newTask.description) return

    const task: MaintenanceTask = {
      id: Date.now().toString(),
      area: newTask.area,
      description: newTask.description,
      priority: newTask.priority,
      status: "pending",
      assignedDate: new Date().toISOString(),
      notes: newTask.notes,
    }

    dispatch({ type: "ADD_MAINTENANCE_TASK", payload: task })

    setNewTask({
      area: "",
      description: "",
      priority: "medium",
      notes: "",
    })
    setIsAddingTask(false)
  }

  const handleUpdateTaskStatus = (taskId: string, status: MaintenanceTask["status"]) => {
    const task = state.maintenanceTasks.find((t) => t.id === taskId)
    if (!task) return

    const updatedTask: MaintenanceTask = {
      ...task,
      status,
      completedDate: status === "completed" ? new Date().toISOString() : undefined,
    }

    dispatch({ type: "UPDATE_MAINTENANCE_TASK", payload: updatedTask })
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea de mantenimiento?")) {
      dispatch({ type: "DELETE_MAINTENANCE_TASK", payload: taskId })
    }
  }

  const getPriorityColor = (priority: MaintenanceTask["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-400 border-red-400"
      case "medium":
        return "text-yellow-400 border-yellow-400"
      case "low":
        return "text-green-400 border-green-400"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const getPriorityLabel = (priority: MaintenanceTask["priority"]) => {
    switch (priority) {
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
      default:
        return priority
    }
  }

  const getStatusColor = (status: MaintenanceTask["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 border-yellow-400"
      case "in_progress":
        return "text-blue-400 border-blue-400"
      case "completed":
        return "text-green-400 border-green-400"
      default:
        return "text-gray-400 border-gray-400"
    }
  }

  const getStatusLabel = (status: MaintenanceTask["status"]) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_progress":
        return "En Progreso"
      case "completed":
        return "Completada"
      default:
        return status
    }
  }

  const getStatusIcon = (status: MaintenanceTask["status"]) => {
    switch (status) {
      case "pending":
        return Clock
      case "in_progress":
        return Wrench
      case "completed":
        return CheckCircle
      default:
        return Clock
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <LogoText />
          <div>
            <h2 className="text-3xl font-bold text-white">Mantenimiento</h2>
            <p className="text-gray-400">Gestión de tareas de mantenimiento</p>
          </div>
        </div>
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Tarea de Mantenimiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="area">Área</Label>
                <Select value={newTask.area} onValueChange={(value) => setNewTask({ ...newTask, area: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {state.configuration.maintenanceAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                  rows={3}
                  placeholder="Descripción de la tarea..."
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: MaintenanceTask["priority"]) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsAddingTask(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddTask} disabled={!newTask.area || !newTask.description}>
                Crear Tarea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tareas</p>
                <p className="text-2xl font-bold text-white">{state.maintenanceTasks.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingTasks.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">En Progreso</p>
                <p className="text-2xl font-bold text-blue-400">{inProgressTasks.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completadas</p>
                <p className="text-2xl font-bold text-green-400">{completedTasks.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-400" />
            Pendientes ({pendingTasks.length})
          </h3>
          <div className="space-y-4">
            {pendingTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status)
              return (
                <Card key={task.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{task.description}</h4>
                        <p className="text-gray-400 text-sm">{task.area}</p>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 text-sm">
                        Asignada: {new Date(task.assignedDate).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    {task.notes && <p className="text-gray-300 text-sm mb-3 p-2 bg-gray-700 rounded">{task.notes}</p>}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        Iniciar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {pendingTasks.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No hay tareas pendientes</h4>
                <p className="text-gray-500">Todas las tareas están asignadas</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-blue-400" />
            En Progreso ({inProgressTasks.length})
          </h3>
          <div className="space-y-4">
            {inProgressTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status)
              return (
                <Card key={task.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{task.description}</h4>
                        <p className="text-gray-400 text-sm">{task.area}</p>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 text-sm">
                        Asignada: {new Date(task.assignedDate).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    {task.notes && <p className="text-gray-300 text-sm mb-3 p-2 bg-gray-700 rounded">{task.notes}</p>}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTaskStatus(task.id, "pending")}
                        className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black"
                      >
                        Pausar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {inProgressTasks.length === 0 && (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No hay tareas en progreso</h4>
                <p className="text-gray-500">Las tareas en ejecución aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
            Completadas ({completedTasks.length})
          </h3>
          <div className="space-y-4">
            {completedTasks
              .slice(-10)
              .reverse()
              .map((task) => {
                const StatusIcon = getStatusIcon(task.status)
                return (
                  <Card key={task.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{task.description}</h4>
                          <p className="text-gray-400 text-sm">{task.area}</p>
                        </div>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          Completada
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Asignada:</span>
                          <span className="text-gray-300 text-sm">
                            {new Date(task.assignedDate).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                        {task.completedDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Completada:</span>
                            <span className="text-green-400 text-sm">
                              {new Date(task.completedDate).toLocaleDateString("es-AR")}
                            </span>
                          </div>
                        )}
                      </div>
                      {task.notes && <p className="text-gray-300 text-sm mt-3 p-2 bg-gray-700 rounded">{task.notes}</p>}
                    </CardContent>
                  </Card>
                )
              })}
            {completedTasks.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No hay tareas completadas</h4>
                <p className="text-gray-500">Las tareas finalizadas aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
