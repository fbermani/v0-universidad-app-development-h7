"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, Users, BedDouble, Calendar, CreditCard, Receipt, Wrench, TrendingUp, Settings, Menu } from "lucide-react"
import { LogoFull } from "@/components/Logo"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet" // Import Sheet components

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false) // New state for "Más" menu

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "residents", icon: Users, label: "Residentes" },
    { id: "rooms", icon: BedDouble, label: "Habitaciones" },
    { id: "reservations", icon: Calendar, label: "Reservas" },
    { id: "payments", icon: CreditCard, label: "Pagos" },
    { id: "expenses", icon: Receipt, label: "Gastos" },
    { id: "maintenance", icon: Wrench, label: "Mantenimiento" },
    { id: "reports", icon: TrendingUp, label: "Informes" },
    { id: "settings", icon: Settings, label: "Configuración" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header - REMOVED */}

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="p-6">
            <LogoFull />
          </div>

          <nav className="mt-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                  currentPage === item.id ? "bg-gray-700 text-white border-r-2 border-blue-400" : ""
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 pb-20 lg:pb-0">{children}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-around items-center py-2">
          {menuItems.slice(0, 4).map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center p-2 ${
                currentPage === item.id ? "text-blue-400" : "text-gray-400"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center p-2 text-gray-400"
            onClick={() => setMoreMenuOpen(true)} // Open "Más" menu
          >
            <Menu className="h-5 w-5" /> {/* Changed to Menu icon for "Más" */}
            <span className="text-xs mt-1">Más</span>
          </Button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* "Más" Mobile Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent side="bottom" className="bg-gray-800 border-t border-gray-700 text-white p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-xl font-bold text-white">Más Opciones</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            {menuItems.slice(4).map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => {
                  onPageChange(item.id)
                  setMoreMenuOpen(false)
                }}
                className={`w-full flex items-center justify-start px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                  currentPage === item.id ? "bg-gray-700 text-white" : ""
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
