"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import type { User, Resident, Room, Reservation, Payment, Expense, MaintenanceTask, Configuration } from "../types"
import { supabase, isDemoMode } from "../lib/supabase"
import {
  mockRooms,
  mockResidents,
  mockReservations,
  mockPayments,
  mockExpenses,
  mockMaintenanceTasks,
  mockConfiguration,
} from "../data/mockData"

interface AppState {
  user: User | null
  residents: Resident[]
  rooms: Room[]
  reservations: Reservation[]
  payments: Payment[]
  expenses: Expense[]
  maintenanceTasks: MaintenanceTask[]
  configuration: Configuration
  pettyCash: number
  selectedResidentIdForDetails: string | null
  isLoading: boolean
  isConnected: boolean
  isDemoMode: boolean
}

type AppAction =
  | { type: "SET_USER"; payload: User }
  | { type: "ADD_RESIDENT"; payload: Resident }
  | { type: "UPDATE_RESIDENT"; payload: Resident }
  | { type: "DELETE_RESIDENT"; payload: string }
  | { type: "ADD_ROOM"; payload: Room }
  | { type: "UPDATE_ROOM"; payload: Room }
  | { type: "DELETE_ROOM"; payload: string }
  | { type: "ADD_RESERVATION"; payload: Reservation }
  | { type: "UPDATE_RESERVATION"; payload: Reservation }
  | { type: "DELETE_RESERVATION"; payload: string }
  | { type: "ADD_PAYMENT"; payload: Payment }
  | { type: "UPDATE_PAYMENT"; payload: Payment }
  | { type: "DELETE_PAYMENT"; payload: string }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "UPDATE_EXPENSE"; payload: Expense }
  | { type: "ADD_MAINTENANCE_TASK"; payload: MaintenanceTask }
  | { type: "UPDATE_MAINTENANCE_TASK"; payload: MaintenanceTask }
  | { type: "DELETE_MAINTENANCE_TASK"; payload: string }
  | { type: "UPDATE_CONFIGURATION"; payload: Configuration }
  | { type: "UPDATE_PETTY_CASH"; payload: number }
  | { type: "GENERATE_MONTHLY_PAYMENTS" }
  | { type: "SAVE_MONTHLY_RATES"; payload: { month: string; userId: string } }
  | { type: "LOAD_DATA"; payload: Partial<AppState> }
  | { type: "SET_SELECTED_RESIDENT_FOR_DETAILS"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SET_DEMO_MODE"; payload: boolean }

const defaultConfiguration: Configuration = {
  id: "default-config-id",
  exchangeRate: 1300,
  lastUpdated: new Date().toISOString(),
  roomRates: {
    individual: 245,
    double: 190,
    triple: 165,
    quadruple: 150,
    quintuple: 135,
  },
  roomRatesARS: {
    individual: Math.round(245 * 1300),
    double: Math.round(190 * 1300),
    triple: Math.round(165 * 1300),
    quadruple: Math.round(150 * 1300),
    quintuple: Math.round(135 * 1300),
  },
  paymentMethods: ["cash", "transfer"],
  expenseCategories: [
    "Alquiler",
    "Aysa",
    "Luz",
    "ABL",
    "Wifi",
    "Seguro",
    "Compras Limpieza",
    "Meli",
    "Eduardo",
    "Honorarios Cont",
    "Mantenimiento Edu",
    "IIBB",
    "Mantenimiento",
    "Monotributo",
    "Publicidad",
    "Serv. Emergencias",
    "Fumig. y Limp. Tanques",
    "Inversión/Mejora",
  ],
  maintenanceAreas: [
    "Habitación",
    "Sala de Estar",
    "Escalera principal",
    "Escalera Terraza",
    "Pasillo",
    "Oficina",
    "Hall",
    "Cocina 1",
    "Cocina 2",
    "Cocina 3",
    "Baño 1",
    "Baño 2",
    "Baño 3",
    "Baño 4",
    "Baño 5",
    "Heladera 1",
    "Heladera 2",
    "Heladera 3",
    "Heladera 4",
  ],
  monthlyHistory: [],
  pettyCash: 50000,
}

const initialState: AppState = {
  user: {
    id: "1",
    name: "Admin",
    email: "admin@residencia.com",
    role: "admin",
  },
  selectedResidentIdForDetails: null,
  residents: [],
  rooms: [],
  reservations: [],
  payments: [],
  expenses: [],
  maintenanceTasks: [],
  configuration: defaultConfiguration,
  pettyCash: 50000,
  isLoading: true,
  isConnected: false,
  isDemoMode: true,
}

function updateRoomOccupancy(rooms: Room[], residents: Resident[]): Room[] {
  return rooms.map((room) => {
    const activeResidentsInRoom = residents.filter(
      (resident) => resident.roomId === room.id && resident.status === "active",
    )
    const currentOccupancy = activeResidentsInRoom.length

    let status: Room["status"] = "available"
    if (currentOccupancy > 0 && currentOccupancy < room.capacity) {
      status = "occupied"
    } else if (currentOccupancy >= room.capacity) {
      status = "occupied"
    }

    return {
      ...room,
      currentOccupancy,
      status,
    }
  })
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload }

    case "SET_DEMO_MODE":
      return { ...state, isDemoMode: action.payload }

    case "SET_SELECTED_RESIDENT_FOR_DETAILS":
      return {
        ...state,
        selectedResidentIdForDetails: action.payload,
      }

    case "SET_USER":
      return { ...state, user: action.payload }

    case "ADD_RESIDENT": {
      const newResidentPayload = action.payload

      if (!state.isDemoMode && newResidentPayload.id !== "general-income") {
        const residentToInsert = {
          id: newResidentPayload.id,
          first_name: newResidentPayload.firstName,
          last_name: newResidentPayload.lastName,
          nationality: newResidentPayload.nationality,
          email: newResidentPayload.email,
          phone: newResidentPayload.phone,
          emergency_contact_name: newResidentPayload.emergencyContact.name,
          emergency_contact_phone: newResidentPayload.emergencyContact.phone,
          emergency_contact_relationship: newResidentPayload.emergencyContact.relationship,
          room_id: newResidentPayload.roomId,
          check_in_date: newResidentPayload.checkInDate,
          check_out_date: newResidentPayload.checkOutDate,
          status: newResidentPayload.status,
          behavior_notes: newResidentPayload.behaviorNotes,
          documents: newResidentPayload.documents,
        }

        supabase
          .from("residents")
          .insert([residentToInsert])
          .then(({ error }) => {
            if (error) {
              console.error("Error adding resident to Supabase:", error)
            }
          })
      }

      const newResidents = [...state.residents, action.payload]
      const updatedRooms = updateRoomOccupancy(state.rooms, newResidents)

      return {
        ...state,
        residents: newResidents,
        rooms: updatedRooms,
      }
    }

    case "UPDATE_RESIDENT": {
      const updatedResidentPayload = action.payload
      const oldResident = state.residents.find((r) => r.id === updatedResidentPayload.id)

      if (!state.isDemoMode && updatedResidentPayload.id !== "general-income") {
        const residentToUpdate = {
          first_name: updatedResidentPayload.firstName,
          last_name: updatedResidentPayload.lastName,
          nationality: updatedResidentPayload.nationality,
          email: updatedResidentPayload.email,
          phone: updatedResidentPayload.phone,
          emergency_contact_name: updatedResidentPayload.emergencyContact.name,
          emergency_contact_phone: updatedResidentPayload.emergencyContact.phone,
          emergency_contact_relationship: updatedResidentPayload.emergencyContact.relationship,
          room_id: updatedResidentPayload.roomId,
          check_in_date: updatedResidentPayload.checkInDate,
          check_out_date: updatedResidentPayload.checkOutDate,
          status: updatedResidentPayload.status,
          behavior_notes: updatedResidentPayload.behaviorNotes,
          documents: updatedResidentPayload.documents,
          updated_at: new Date().toISOString(),
        }

        supabase
          .from("residents")
          .update(residentToUpdate)
          .eq("id", updatedResidentPayload.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating resident in Supabase:", error)
            }
          })
      }

      const newResidents = state.residents.map((r) => (r.id === updatedResidentPayload.id ? updatedResidentPayload : r))
      const updatedRooms = updateRoomOccupancy(state.rooms, newResidents)

      let newPayments = [...state.payments]

      if (oldResident?.status === "active" && updatedResidentPayload.status === "inactive") {
        newPayments = state.payments.filter(
          (p) => !(p.residentId === updatedResidentPayload.id && p.status === "pending"),
        )

        if (!state.isDemoMode) {
          supabase
            .from("payments")
            .delete()
            .eq("resident_id", updatedResidentPayload.id)
            .eq("status", "pending")
            .then(({ error }) => {
              if (error) console.error("Error deleting pending payments for inactive resident:", error)
            })
        }
      }

      return {
        ...state,
        residents: newResidents,
        rooms: updatedRooms,
        payments: newPayments,
      }
    }

    case "DELETE_RESIDENT": {
      const residentIdToDelete = action.payload

      if (!state.isDemoMode && residentIdToDelete !== "general-income") {
        supabase
          .from("residents")
          .delete()
          .eq("id", residentIdToDelete)
          .then(({ error }) => {
            if (error) {
              console.error("Error deleting resident from Supabase:", error)
            }
          })
      }

      const newResidents = state.residents.filter((r) => r.id !== residentIdToDelete)
      const updatedRooms = updateRoomOccupancy(state.rooms, newResidents)
      const newPayments = state.payments.filter((p) => p.residentId !== residentIdToDelete)
      const newReservations = state.reservations.filter((r) => r.residentId !== residentIdToDelete)

      return {
        ...state,
        residents: newResidents,
        rooms: updatedRooms,
        payments: newPayments,
        reservations: newReservations,
      }
    }

    case "ADD_ROOM": {
      const newRoomPayload = action.payload

      if (!state.isDemoMode) {
        const roomToInsert = {
          id: newRoomPayload.id,
          number: newRoomPayload.number,
          type: newRoomPayload.type,
          capacity: newRoomPayload.capacity,
          current_occupancy: newRoomPayload.currentOccupancy,
          status: newRoomPayload.status,
          monthly_rate_usd: newRoomPayload.monthlyRate,
          gender: newRoomPayload.gender,
        }

        supabase
          .from("rooms")
          .insert([roomToInsert])
          .then(({ error }) => {
            if (error) {
              console.error("Error adding room to Supabase:", error)
            }
          })
      }

      const newRooms = [...state.rooms, action.payload]
      return { ...state, rooms: updateRoomOccupancy(newRooms, state.residents) }
    }

    case "UPDATE_ROOM": {
      const updatedRoomPayload = action.payload

      if (!state.isDemoMode) {
        const roomToUpdate = {
          number: updatedRoomPayload.number,
          type: updatedRoomPayload.type,
          capacity: updatedRoomPayload.capacity,
          current_occupancy: updatedRoomPayload.currentOccupancy,
          status: updatedRoomPayload.status,
          monthly_rate_usd: updatedRoomPayload.monthlyRate,
          gender: updatedRoomPayload.gender,
          updated_at: new Date().toISOString(),
        }

        supabase
          .from("rooms")
          .update(roomToUpdate)
          .eq("id", updatedRoomPayload.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating room in Supabase:", error)
            }
          })
      }

      const newRooms = state.rooms.map((r) => (r.id === updatedRoomPayload.id ? updatedRoomPayload : r))
      return { ...state, rooms: updateRoomOccupancy(newRooms, state.residents) }
    }

    case "DELETE_ROOM": {
      const roomIdToDelete = action.payload

      if (!state.isDemoMode) {
        supabase
          .from("rooms")
          .delete()
          .eq("id", roomIdToDelete)
          .then(({ error }) => {
            if (error) {
              console.error("Error deleting room from Supabase:", error)
            }
          })
      }

      const updatedResidents = state.residents.map((resident) =>
        resident.roomId === roomIdToDelete ? { ...resident, roomId: "", status: "inactive" as const } : resident,
      )

      const updatedReservations = state.reservations.filter((reservation) => reservation.roomId !== roomIdToDelete)

      const affectedResidentIds = state.residents
        .filter((resident) => resident.roomId === roomIdToDelete)
        .map((resident) => resident.id)

      const updatedPayments = state.payments.filter(
        (payment) => !(affectedResidentIds.includes(payment.residentId) && payment.status === "pending"),
      )

      const newRooms = state.rooms.filter((room) => room.id !== roomIdToDelete)

      return {
        ...state,
        rooms: updateRoomOccupancy(newRooms, updatedResidents),
        residents: updatedResidents,
        reservations: updatedReservations,
        payments: updatedPayments,
      }
    }

    case "ADD_RESERVATION": {
      const newReservationPayload = action.payload

      if (!state.isDemoMode) {
        const reservationToInsert = {
          id: newReservationPayload.id,
          resident_id: newReservationPayload.residentId,
          room_id: newReservationPayload.roomId,
          start_date: newReservationPayload.startDate,
          end_date: newReservationPayload.endDate,
          status: newReservationPayload.status,
          matricula_amount: newReservationPayload.matriculaAmount,
          discount_type: newReservationPayload.discount?.type,
          discount_value: newReservationPayload.discount?.value,
        }

        supabase
          .from("reservations")
          .insert([reservationToInsert])
          .then(({ error }) => {
            if (error) {
              console.error("Error adding reservation to Supabase:", error)
            }
          })
      }

      const matriculaPayment: Payment = {
        id: `matricula-${Date.now()}-${action.payload.residentId}`,
        residentId: action.payload.residentId,
        amount: action.payload.matriculaAmount,
        currency: "ARS",
        method: "cash",
        date: new Date().toISOString(),
        type: "matricula",
        status: "pending",
      }

      if (!state.isDemoMode) {
        const matriculaPaymentToInsert = {
          id: matriculaPayment.id,
          resident_id: matriculaPayment.residentId,
          amount: matriculaPayment.amount,
          currency: matriculaPayment.currency,
          method: matriculaPayment.method,
          date: matriculaPayment.date,
          type: matriculaPayment.type,
          status: matriculaPayment.status,
        }
        supabase
          .from("payments")
          .insert([matriculaPaymentToInsert])
          .then(({ error }) => {
            if (error) console.error("Error adding matricula payment to Supabase:", error)
          })
      }

      return {
        ...state,
        reservations: [...state.reservations, newReservationPayload],
        payments: [...state.payments, matriculaPayment],
      }
    }

    case "UPDATE_RESERVATION": {
      const newReservations = state.reservations.map((r) => (r.id === action.payload.id ? action.payload : r))
      return { ...state, reservations: newReservations }
    }

    case "DELETE_RESERVATION": {
      const reservationIdToDelete = action.payload
      const reservation = state.reservations.find((r) => r.id === reservationIdToDelete)

      if (!state.isDemoMode) {
        supabase
          .from("reservations")
          .delete()
          .eq("id", reservationIdToDelete)
          .then(({ error }) => {
            if (error) {
              console.error("Error deleting reservation from Supabase:", error)
            }
          })
      }

      const newReservations = state.reservations.filter((r) => r.id !== reservationIdToDelete)
      const newState = { ...state, reservations: newReservations }

      if (reservation) {
        const resident = state.residents.find((r) => r.id === reservation.residentId)
        if (resident && resident.status === "pending") {
          newState.residents = state.residents.filter((r) => r.id !== reservation.residentId)
          newState.rooms = updateRoomOccupancy(newState.rooms, newState.residents)
          newState.payments = state.payments.filter(
            (p) => !(p.residentId === reservation.residentId && p.status === "pending"),
          )

          if (!state.isDemoMode) {
            supabase
              .from("residents")
              .delete()
              .eq("id", reservation.residentId)
              .then(({ error }) => {
                if (error) console.error("Error deleting resident associated with cancelled reservation:", error)
              })
            supabase
              .from("payments")
              .delete()
              .eq("resident_id", reservation.residentId)
              .eq("status", "pending")
              .then(({ error }) => {
                if (error) console.error("Error deleting pending payments for cancelled reservation:", error)
              })
          }
        }
      }

      return newState
    }

    case "ADD_PAYMENT": {
      const newPaymentPayload = action.payload

      if (!state.isDemoMode) {
        const paymentToInsert = {
          id: newPaymentPayload.id,
          resident_id: newPaymentPayload.residentId,
          amount: newPaymentPayload.amount,
          currency: newPaymentPayload.currency,
          method: newPaymentPayload.method,
          date: newPaymentPayload.date,
          type: newPaymentPayload.type,
          status: newPaymentPayload.status,
          receipt_number: newPaymentPayload.receiptNumber,
          is_partial_payment: newPaymentPayload.isPartialPayment,
        }

        supabase
          .from("payments")
          .insert([paymentToInsert])
          .then(({ error }) => {
            if (error) {
              console.error("Error adding payment to Supabase:", error)
            }
          })
      }

      const newPayments = [...state.payments, action.payload]
      return { ...state, payments: newPayments }
    }

    case "UPDATE_PAYMENT": {
      const updatedPaymentPayload = action.payload
      const originalPayment = state.payments.find((p) => p.id === updatedPaymentPayload.id)

      if (!state.isDemoMode) {
        const paymentToUpdate = {
          amount: updatedPaymentPayload.amount,
          method: updatedPaymentPayload.method,
          status: updatedPaymentPayload.status,
          receipt_number: updatedPaymentPayload.receiptNumber,
          date: updatedPaymentPayload.date,
          is_partial_payment: updatedPaymentPayload.isPartialPayment,
          updated_at: new Date().toISOString(),
        }

        supabase
          .from("payments")
          .update(paymentToUpdate)
          .eq("id", updatedPaymentPayload.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating payment in Supabase:", error)
            }
          })
      }

      let newPayments = state.payments.map((p) => (p.id === updatedPaymentPayload.id ? updatedPaymentPayload : p))

      if (updatedPaymentPayload.status === "completed" && originalPayment) {
        if (updatedPaymentPayload.amount < originalPayment.amount) {
          const remainingAmount = originalPayment.amount - updatedPaymentPayload.amount
          const remainingPayment: Payment = {
            id: `partial-${Date.now()}-${updatedPaymentPayload.residentId}`,
            residentId: updatedPaymentPayload.residentId,
            amount: remainingAmount,
            currency: updatedPaymentPayload.currency,
            method: updatedPaymentPayload.method,
            date: new Date().toISOString(),
            type: updatedPaymentPayload.type,
            status: "pending",
            isPartialPayment: true,
          }
          newPayments = [...newPayments, remainingPayment]

          if (!state.isDemoMode) {
            const partialPaymentToInsert = {
              id: remainingPayment.id,
              resident_id: remainingPayment.residentId,
              amount: remainingPayment.amount,
              currency: remainingPayment.currency,
              method: remainingPayment.method,
              date: remainingPayment.date,
              type: remainingPayment.type,
              status: remainingPayment.status,
              is_partial_payment: remainingPayment.isPartialPayment,
            }
            supabase
              .from("payments")
              .insert([partialPaymentToInsert])
              .then(({ error }) => {
                if (error) console.error("Error adding partial payment to Supabase:", error)
              })
          }
        }
      }

      return { ...state, payments: newPayments }
    }

    case "DELETE_PAYMENT": {
      const paymentIdToDelete = action.payload

      if (!state.isDemoMode) {
        supabase
          .from("payments")
          .delete()
          .eq("id", paymentIdToDelete)
          .then(({ error }) => {
            if (error) {
              console.error("Error deleting payment from Supabase:", error)
            }
          })
      }

      const newPayments = state.payments.filter((p) => p.id !== paymentIdToDelete)
      return { ...state, payments: newPayments }
    }

    case "ADD_EXPENSE": {
      const newExpensePayload = action.payload

      if (!state.isDemoMode) {
        const expenseToInsert = {
          id: newExpensePayload.id,
          category: newExpensePayload.category,
          amount: newExpensePayload.amount,
          currency: newExpensePayload.currency,
          method: newExpensePayload.method,
          date: newExpensePayload.date,
          description: newExpensePayload.description,
          receipt: newExpensePayload.receipt,
        }

        supabase
          .from("expenses")
          .insert([expenseToInsert])
          .then(({ error }) => {
            if (error) {
              console.error("Error adding expense to Supabase:", error)
            }
          })
      }

      const newExpenses = [...state.expenses, action.payload]
      let newPettyCash = state.pettyCash

      if (action.payload.method === "petty_cash") {
        newPettyCash = state.pettyCash - action.payload.amount

        if (!state.isDemoMode) {
          supabase
            .from("configurations")
            .update({ petty_cash: newPettyCash, updated_at: new Date().toISOString() })
            .eq("id", state.configuration.id)
            .then(({ error }) => {
              if (error) console.error("Error updating petty cash in Supabase:", error)
            })
        }
      }

      return { ...state, expenses: newExpenses, pettyCash: newPettyCash }
    }

    case "UPDATE_EXPENSE": {
      const updatedExpensePayload = action.payload

      if (!state.isDemoMode) {
        const expenseToUpdate = {
          category: updatedExpensePayload.category,
          amount: updatedExpensePayload.amount,
          currency: updatedExpensePayload.currency,
          method: updatedExpensePayload.method,
          date: updatedExpensePayload.date,
          description: updatedExpensePayload.description,
          receipt: updatedExpensePayload.receipt,
          updated_at: new Date().toISOString(),
        }

        supabase
          .from("expenses")
          .update(expenseToUpdate)
          .eq("id", updatedExpensePayload.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating expense in Supabase:", error)
            }
          })
      }

      const newExpenses = state.expenses.map((e) => (e.id === updatedExpensePayload.id ? updatedExpensePayload : e))
      return { ...state, expenses: newExpenses }
    }

    case "ADD_MAINTENANCE_TASK": {
      const newTaskPayload = action.payload

      if (!state.isDemoMode) {
        const taskToInsert = {
          id: newTaskPayload.id,
          area: newTaskPayload.area,
          description: newTaskPayload.description,
          priority: newTaskPayload.priority,
          status: newTaskPayload.status,
          assigned_date: newTaskPayload.assignedDate,
          notes: newTaskPayload.notes,
        }

        supabase
          .from("maintenance_tasks")
          .insert([taskToInsert])
          .then(({ error }) => {
            if (error) {
              console.error("Error adding maintenance task to Supabase:", error)
            }
          })
      }

      const newTasks = [...state.maintenanceTasks, action.payload]
      return { ...state, maintenanceTasks: newTasks }
    }

    case "UPDATE_MAINTENANCE_TASK": {
      const updatedTaskPayload = action.payload

      if (!state.isDemoMode) {
        const taskToUpdate = {
          area: updatedTaskPayload.area,
          description: updatedTaskPayload.description,
          priority: updatedTaskPayload.priority,
          status: updatedTaskPayload.status,
          assigned_date: updatedTaskPayload.assignedDate,
          completed_date: updatedTaskPayload.completedDate,
          photos: updatedTaskPayload.photos,
          notes: updatedTaskPayload.notes,
          updated_at: new Date().toISOString(),
        }

        supabase
          .from("maintenance_tasks")
          .update(taskToUpdate)
          .eq("id", updatedTaskPayload.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating maintenance task in Supabase:", error)
            }
          })
      }

      const newTasks = state.maintenanceTasks.map((t) => (t.id === updatedTaskPayload.id ? updatedTaskPayload : t))
      return { ...state, maintenanceTasks: newTasks }
    }

    case "DELETE_MAINTENANCE_TASK": {
      const taskIdToDelete = action.payload

      if (!state.isDemoMode) {
        supabase
          .from("maintenance_tasks")
          .delete()
          .eq("id", taskIdToDelete)
          .then(({ error }) => {
            if (error) {
              console.error("Error deleting maintenance task from Supabase:", error)
            }
          })
      }

      const newTasks = state.maintenanceTasks.filter((t) => t.id !== taskIdToDelete)
      return { ...state, maintenanceTasks: newTasks }
    }

    case "UPDATE_CONFIGURATION": {
      const updatedConfigPayload = action.payload

      if (!state.isDemoMode) {
        const configToUpdate = {
          exchange_rate: updatedConfigPayload.exchangeRate,
          last_updated: updatedConfigPayload.lastUpdated,
          room_rates_usd: updatedConfigPayload.roomRates,
          room_rates_ars: updatedConfigPayload.roomRatesARS,
          payment_methods: updatedConfigPayload.paymentMethods,
          expense_categories: updatedConfigPayload.expenseCategories,
          maintenance_areas: updatedConfigPayload.maintenanceAreas,
          petty_cash: updatedConfigPayload.pettyCash,
          updated_at: new Date().toISOString(),
        }

        supabase
          .from("configurations")
          .upsert([{ id: updatedConfigPayload.id, ...configToUpdate }])
          .then(({ error }) => {
            if (error) {
              console.error("Error updating configuration in Supabase:", error)
            }
          })
      }

      return { ...state, configuration: updatedConfigPayload }
    }

    case "UPDATE_PETTY_CASH": {
      const updatedPettyCash = action.payload

      if (!state.isDemoMode) {
        supabase
          .from("configurations")
          .update({ petty_cash: updatedPettyCash, updated_at: new Date().toISOString() })
          .eq("id", state.configuration.id)
          .then(({ error }) => {
            if (error) console.error("Error updating petty cash in Supabase:", error)
          })
      }

      return { ...state, pettyCash: updatedPettyCash }
    }

    case "SAVE_MONTHLY_RATES": {
      const { month, userId } = action.payload

      const newHistoryEntry = {
        id: `history-${Date.now()}`,
        month,
        exchange_rate: state.configuration.exchangeRate,
        room_rates_usd: state.configuration.roomRates,
        room_rates_ars: state.configuration.roomRatesARS,
        created_date: new Date().toISOString(),
        created_by: userId,
      }

      if (!state.isDemoMode) {
        supabase
          .from("monthly_rate_history")
          .upsert(newHistoryEntry, { onConflict: "month" })
          .then(({ error }) => {
            if (error) {
              console.error("Error saving monthly rates history to Supabase:", error)
            }
          })
      }

      let updatedHistory = [...state.configuration.monthlyHistory]
      const existingHistoryIndex = updatedHistory.findIndex((h) => h.month === month)

      if (existingHistoryIndex >= 0) {
        updatedHistory[existingHistoryIndex] = {
          ...updatedHistory[existingHistoryIndex],
          ...newHistoryEntry,
          id: updatedHistory[existingHistoryIndex].id,
        }
      } else {
        updatedHistory.push(newHistoryEntry)
      }

      updatedHistory = updatedHistory.sort((a, b) => b.month.localeCompare(a.month)).slice(0, 24)

      const updatedConfig = {
        ...state.configuration,
        monthlyHistory: updatedHistory,
        lastUpdated: new Date().toISOString(),
      }

      if (!state.isDemoMode) {
        supabase
          .from("configurations")
          .update({
            last_updated: updatedConfig.lastUpdated,
            monthly_history: updatedConfig.monthlyHistory,
          })
          .eq("id", updatedConfig.id)
          .then(({ error }) => {
            if (error) console.error("Error updating configuration in Supabase:", error)
          })
      }

      return { ...state, configuration: updatedConfig }
    }

    case "GENERATE_MONTHLY_PAYMENTS": {
      const activeResidents = state.residents.filter((r) => r.status === "active")
      const newPayments: Payment[] = []

      activeResidents.forEach((resident) => {
        const room = state.rooms.find((r) => r.id === resident.roomId)
        if (room) {
          const existingPayment = state.payments.find(
            (p) => p.residentId === resident.id && p.type === "monthly_rent" && p.status === "pending",
          )

          if (!existingPayment) {
            const monthlyPayment: Payment = {
              id: `monthly-${Date.now()}-${resident.id}`,
              residentId: resident.id,
              amount: state.configuration.roomRatesARS[room.type] || 0,
              currency: "ARS",
              method: "cash",
              date: new Date().toISOString(),
              type: "monthly_rent",
              status: "pending",
            }
            newPayments.push(monthlyPayment)

            if (!state.isDemoMode) {
              const monthlyPaymentToInsert = {
                id: monthlyPayment.id,
                resident_id: monthlyPayment.residentId,
                amount: monthlyPayment.amount,
                currency: monthlyPayment.currency,
                method: monthlyPayment.method,
                date: monthlyPayment.date,
                type: monthlyPayment.type,
                status: monthlyPayment.status,
              }
              supabase
                .from("payments")
                .insert([monthlyPaymentToInsert])
                .then(({ error }) => {
                  if (error) console.error("Error adding monthly payment to Supabase:", error)
                })
            }
          }
        }
      })

      return { ...state, payments: [...state.payments, ...newPayments] }
    }

    case "LOAD_DATA": {
      const loadedState = action.payload
      const updatedRooms = loadedState.rooms
        ? updateRoomOccupancy(loadedState.rooms, loadedState.residents || [])
        : state.rooms

      return {
        ...state,
        ...loadedState,
        rooms: updatedRooms,
      }
    }

    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const loadAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })

    const isDemo = isDemoMode
    dispatch({ type: "SET_DEMO_MODE", payload: isDemo })

    if (isDemo) {
      dispatch({
        type: "LOAD_DATA",
        payload: {
          residents: mockResidents,
          rooms: mockRooms,
          reservations: mockReservations,
          payments: mockPayments,
          expenses: mockExpenses,
          maintenanceTasks: mockMaintenanceTasks,
          configuration: mockConfiguration,
          pettyCash: mockConfiguration.pettyCash || 50000,
          isLoading: false,
          isDemoMode: true,
          isConnected: false,
        },
      })
      return
    }

    try {
      const [
        { data: residents, error: residentsError },
        { data: rooms, error: roomsError },
        { data: reservations, error: reservationsError },
        { data: payments, error: paymentsError },
        { data: expenses, error: expensesError },
        { data: maintenanceTasks, error: maintenanceTasksError },
        { data: configurations, error: configError },
        { data: monthlyHistory, error: historyError },
      ] = await Promise.all([
        supabase.from("residents").select("*"),
        supabase.from("rooms").select("*"),
        supabase.from("reservations").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("maintenance_tasks").select("*"),
        supabase.from("configurations").select("*").limit(1),
        supabase.from("monthly_rate_history").select("*"),
      ])

      if (
        residentsError ||
        roomsError ||
        reservationsError ||
        paymentsError ||
        expensesError ||
        maintenanceTasksError ||
        configError ||
        historyError
      ) {
        dispatch({ type: "SET_CONNECTION_STATUS", payload: false })
        dispatch({
          type: "LOAD_DATA",
          payload: {
            residents: mockResidents,
            rooms: mockRooms,
            reservations: mockReservations,
            payments: mockPayments,
            expenses: mockExpenses,
            maintenanceTasks: mockMaintenanceTasks,
            configuration: mockConfiguration,
            pettyCash: mockConfiguration.pettyCash || 50000,
            isLoading: false,
            isDemoMode: true,
            isConnected: false,
          },
        })
        return
      }

      const loadedConfig =
        configurations && configurations.length > 0
          ? {
              id: configurations[0].id,
              exchangeRate: configurations[0].exchange_rate,
              lastUpdated: configurations[0].last_updated,
              roomRates: configurations[0].room_rates_usd,
              roomRatesARS: configurations[0].room_rates_ars,
              paymentMethods: configurations[0].payment_methods,
              expenseCategories: configurations[0].expense_categories,
              maintenanceAreas: configurations[0].maintenance_areas,
              monthlyHistory: monthlyHistory || [],
              pettyCash: configurations[0].petty_cash,
            }
          : defaultConfiguration

      const parsedResidents =
        residents?.map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          nationality: r.nationality,
          email: r.email,
          phone: r.phone,
          emergencyContact: {
            name: r.emergency_contact_name,
            phone: r.emergency_contact_phone,
            relationship: r.emergency_contact_relationship,
          },
          roomId: r.room_id,
          checkInDate: r.check_in_date,
          checkOutDate: r.check_out_date,
          status: r.status,
          behaviorNotes: r.behavior_notes || [],
          documents: r.documents || [],
        })) || []

      const parsedRooms =
        rooms?.map((r) => ({
          id: r.id,
          number: r.number,
          type: r.type,
          capacity: r.capacity,
          currentOccupancy: r.current_occupancy,
          status: r.status,
          monthlyRate: r.monthly_rate_usd,
          gender: r.gender || "male",
        })) || []

      const parsedReservations =
        reservations?.map((r) => ({
          id: r.id,
          residentId: r.resident_id,
          roomId: r.room_id,
          startDate: r.start_date,
          endDate: r.end_date,
          status: r.status,
          matriculaAmount: r.matricula_amount,
          discount: r.discount_type ? { type: r.discount_type, value: r.discount_value } : undefined,
          cancellationReason: r.cancellation_reason,
        })) || []

      const parsedPayments =
        payments?.map((p) => ({
          id: p.id,
          residentId: p.resident_id,
          amount: p.amount,
          currency: p.currency,
          method: p.method,
          date: p.date,
          type: p.type,
          status: p.status,
          receiptNumber: p.receipt_number,
          isPartialPayment: p.is_partial_payment,
        })) || []

      const parsedExpenses =
        expenses?.map((e) => ({
          id: e.id,
          category: e.category,
          amount: e.amount,
          currency: e.currency,
          method: e.method,
          date: e.date,
          description: e.description,
          receipt: e.receipt,
        })) || []

      const parsedMaintenanceTasks =
        maintenanceTasks?.map((t) => ({
          id: t.id,
          area: t.area,
          description: t.description,
          priority: t.priority,
          status: t.status,
          assignedDate: t.assigned_date,
          completedDate: t.completed_date,
          photos: t.photos || [],
          notes: t.notes,
        })) || []

      dispatch({
        type: "LOAD_DATA",
        payload: {
          residents: parsedResidents,
          rooms: parsedRooms,
          reservations: parsedReservations,
          payments: parsedPayments,
          expenses: parsedExpenses,
          maintenanceTasks: parsedMaintenanceTasks,
          configuration: loadedConfig,
          pettyCash: loadedConfig.pettyCash,
          isLoading: false,
          isDemoMode: false,
          isConnected: true,
        },
      })
    } catch (error) {
      dispatch({ type: "SET_CONNECTION_STATUS", payload: false })
      dispatch({
        type: "LOAD_DATA",
        payload: {
          residents: mockResidents,
          rooms: mockRooms,
          reservations: mockReservations,
          payments: mockPayments,
          expenses: mockExpenses,
          maintenanceTasks: mockMaintenanceTasks,
          configuration: mockConfiguration,
          pettyCash: mockConfiguration.pettyCash || 50000,
          isLoading: false,
          isDemoMode: true,
          isConnected: false,
        },
      })
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export const useAppContext = useApp
