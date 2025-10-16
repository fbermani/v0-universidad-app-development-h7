export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff"
}

export interface Room {
  id: string
  number: string
  type: "individual" | "double" | "triple" | "quadruple" | "quintuple"
  capacity: number
  currentOccupancy: number
  status: "available" | "occupied" | "maintenance"
  monthlyRate: number
  gender?: "male" | "female"
}

export interface Resident {
  id: string
  firstName: string
  lastName: string
  nationality:
    | "argentina"
    | "bolivia"
    | "brasil"
    | "chile"
    | "colombia"
    | "ecuador"
    | "paraguay"
    | "peru"
    | "uruguay"
    | "venezuela"
  email: string
  phone: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  roomId: string
  checkInDate: string
  checkOutDate?: string
  status: "active" | "inactive" | "pending"
  behaviorNotes: BehaviorNote[]
  documents: Document[]
}

export interface BehaviorNote {
  id: string
  date: string
  type: "verbal" | "written"
  description: string
  severity: "low" | "medium" | "high"
  createdBy: string
}

export interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadDate: string
}

export interface Reservation {
  id: string
  residentId: string
  roomId: string
  startDate: string
  endDate: string
  status: "pending" | "confirmed" | "cancelled"
  matriculaAmount: number
  discount?: {
    type: "percentage" | "fixed"
    value: number
  }
  cancellationReason?: string
}

export interface Payment {
  id: string
  residentId: string
  amount: number
  currency: "USD" | "ARS"
  method: "cash" | "transfer" | "card" | "petty_cash"
  date: string
  type: "monthly_rent" | "deposit" | "utilities" | "other" | "matricula"
  status: "pending" | "completed" | "cancelled"
  receiptNumber?: string
  isPartialPayment?: boolean
}

export interface Expense {
  id: string
  category: string
  description: string
  amount: number
  currency: "USD" | "ARS"
  date: string
  method: "cash" | "transfer" | "card" | "petty_cash"
  receipt?: string
}

export interface MaintenanceTask {
  id: string
  area: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed"
  assignedDate: string
  completedDate?: string
  photos?: string[]
  notes?: string
}

export interface Configuration {
  id: string
  exchangeRate: number
  lastUpdated: string
  roomRates: {
    individual: number
    double: number
    triple: number
    quadruple: number
    quintuple: number
  }
  roomRatesARS: {
    individual: number
    double: number
    triple: number
    quadruple: number
    quintuple: number
  }
  paymentMethods: string[]
  expenseCategories: string[]
  maintenanceAreas: string[]
  monthlyHistory: MonthlyRateHistory[]
  pettyCash: number
}

export interface MonthlyRateHistory {
  id: string
  month: string
  exchange_rate: number
  room_rates_usd: {
    individual: number
    double: number
    triple: number
    quadruple: number
    quintuple: number
  }
  room_rates_ars: {
    individual: number
    double: number
    triple: number
    quadruple: number
    quintuple: number
  }
  created_date: string
  created_by: string
}

export interface AppState {
  user: User | null
  rooms: Room[]
  residents: Resident[]
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

export type AppAction =
  | { type: "SET_SELECTED_RESIDENT_FOR_DETAILS"; payload: string | null }
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
  | { type: "SET_USER"; payload: User }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SET_DEMO_MODE"; payload: boolean }
