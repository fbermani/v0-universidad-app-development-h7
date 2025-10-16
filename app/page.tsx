"use client"

import { useState } from "react"
import { AppProvider } from "../context/AppContext"
import Layout from "../components/Layout"
import Dashboard from "../components/Dashboard"
import Residents from "../components/Residents"
import Rooms from "../components/Rooms"
import Reservations from "../components/Reservations"
import Payments from "../components/Payments"
import Expenses from "../components/Expenses"
import Maintenance from "../components/Maintenance"
import Reports from "../components/Reports"
import Settings from "../components/Settings"

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "residents":
        return <Residents />
      case "rooms":
        return <Rooms />
      case "reservations":
        return <Reservations />
      case "payments":
        return <Payments />
      case "expenses":
        return <Expenses />
      case "maintenance":
        return <Maintenance />
      case "reports":
        return <Reports />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
