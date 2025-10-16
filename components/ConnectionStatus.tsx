"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Copy } from "lucide-react"
import { testConnection, getDatabaseStats, isDemoMode, isSupabaseConfigured } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function ConnectionStatus() {
  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    mode: "demo" | "production"
    error?: string
    details?: string
  } | null>(null)
  const [stats, setStats] = useState<{
    residents: number
    rooms: number
    payments: number
    mode: "demo" | "production" | "error"
  } | null>(null)

  const handleTestConnection = async () => {
    setIsChecking(true)
    try {
      const result = await testConnection()
      const statsResult = await getDatabaseStats()

      setConnectionStatus(result)
      setStats(statsResult)
      setLastCheck(new Date())

      if (result.connected) {
        toast({
          title: "Conexión exitosa",
          description: "Conectado correctamente a Supabase",
        })
      } else if (result.mode === "demo") {
        toast({
          title: "Modo Demo",
          description: "Funcionando con datos de ejemplo",
          variant: "default",
        })
      } else {
        toast({
          title: "Error de conexión",
          description: result.details || "No se pudo conectar a Supabase",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al verificar la conexión",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const copyEnvTemplate = () => {
    const template = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`

    navigator.clipboard.writeText(template)
    toast({
      title: "Copiado",
      description: "Template de .env.local copiado al portapapeles",
    })
  }

  const getStatusBadge = () => {
    if (!connectionStatus) return null

    if (connectionStatus.mode === "demo") {
      return (
        <Badge variant="secondary" className="gap-2">
          <AlertTriangle className="h-3 w-3" />
          Modo Demo
        </Badge>
      )
    }

    if (connectionStatus.connected) {
      return (
        <Badge variant="default" className="gap-2 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Conectado
        </Badge>
      )
    }

    return (
      <Badge variant="destructive" className="gap-2">
        <XCircle className="h-3 w-3" />
        Desconectado
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estado de la Base de Datos</CardTitle>
            <CardDescription>Información sobre la conexión a Supabase</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado Actual */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo de Operación</p>
              <p className="text-sm text-muted-foreground">
                {isDemoMode ? "Demo (datos temporales)" : "Producción (datos persistentes)"}
              </p>
            </div>
            <Button onClick={handleTestConnection} disabled={isChecking} variant="outline" size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              Verificar
            </Button>
          </div>

          {lastCheck && (
            <p className="text-xs text-muted-foreground">
              Última verificación: {lastCheck.toLocaleTimeString("es-AR")}
            </p>
          )}
        </div>

        {/* Detalles de Conexión */}
        {connectionStatus && (
          <Alert variant={connectionStatus.connected ? "default" : "destructive"}>
            <AlertDescription>
              {connectionStatus.details}
              {connectionStatus.error && (
                <div className="mt-2">
                  <strong>Error:</strong> {connectionStatus.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Estadísticas */}
        {stats && stats.mode !== "demo" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Registros en Base de Datos</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{stats.residents}</p>
                <p className="text-xs text-muted-foreground">Residentes</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{stats.rooms}</p>
                <p className="text-xs text-muted-foreground">Habitaciones</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{stats.payments}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuración */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Variables de Entorno</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">NEXT_PUBLIC_SUPABASE_URL</span>
              <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
                {isSupabaseConfigured ? "Configurada" : "No configurada"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
                {isSupabaseConfigured ? "Configurada" : "No configurada"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Instrucciones para Activar Supabase */}
        {isDemoMode && (
          <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Para activar Supabase:</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Crea un proyecto en supabase.com/dashboard</li>
              <li>2. Copia las credenciales de tu proyecto</li>
              <li>3. Crea un archivo .env.local en la raíz del proyecto</li>
              <li>4. Ejecuta el script SQL desde scripts/001_create_tables.sql</li>
            </ol>
            <Button onClick={copyEnvTemplate} variant="outline" size="sm" className="w-full bg-transparent">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Template .env.local
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
