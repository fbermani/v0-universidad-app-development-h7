import { createClient } from "@supabase/supabase-js"

// Verificar si estamos en un entorno que requiere Supabase real
const hasSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://demo.supabase.co" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "demo-anon-key"

// Modo demo: usar valores dummy que no intentarán conectarse
const DEMO_URL = "https://demo.supabase.co"
const DEMO_ANON_KEY = "demo-anon-key"

export const supabaseUrl = hasSupabaseConfig ? process.env.NEXT_PUBLIC_SUPABASE_URL! : DEMO_URL

export const supabaseAnonKey = hasSupabaseConfig ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : DEMO_ANON_KEY

export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "demo-service-role-key"

// Cliente público (solo con anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente con service role para operaciones administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// Estado de configuración (exportar como constante, no función)
export const isSupabaseConfigured = hasSupabaseConfig
export const isDemoMode = !hasSupabaseConfig

// Función para verificar la conexión
export async function testConnection(): Promise<{
  connected: boolean
  mode: "demo" | "production"
  error?: string
  details?: string
}> {
  // Si estamos en modo demo, retornar inmediatamente sin intentar conectar
  if (isDemoMode) {
    return {
      connected: false,
      mode: "demo",
      details: "Funcionando en modo demo con datos de ejemplo",
    }
  }

  try {
    // Intentar una consulta simple
    const { data, error } = await supabase.from("configurations").select("id").limit(1)

    if (error) {
      // Error específico cuando las tablas no existen
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        return {
          connected: false,
          mode: "production",
          error: "Tablas no encontradas",
          details:
            "Las credenciales son correctas pero las tablas de la base de datos no existen. Ejecuta el script SQL desde scripts/001_create_tables.sql en el SQL Editor de Supabase.",
        }
      }

      return {
        connected: false,
        mode: "production",
        error: error.message,
        details: "Error al conectar con Supabase. Verifica tus credenciales.",
      }
    }

    return {
      connected: true,
      mode: "production",
      details: "Conectado correctamente a Supabase",
    }
  } catch (err) {
    return {
      connected: false,
      mode: "production",
      error: err instanceof Error ? err.message : "Error desconocido",
      details: "Error al verificar la conexión",
    }
  }
}

// Función para obtener estadísticas de la base de datos
export async function getDatabaseStats() {
  if (isDemoMode) {
    return {
      residents: 0,
      rooms: 0,
      payments: 0,
      mode: "demo" as const,
    }
  }

  try {
    const [{ count: residentsCount }, { count: roomsCount }, { count: paymentsCount }] = await Promise.all([
      supabase.from("residents").select("*", { count: "exact", head: true }),
      supabase.from("rooms").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }),
    ])

    return {
      residents: residentsCount || 0,
      rooms: roomsCount || 0,
      payments: paymentsCount || 0,
      mode: "production" as const,
    }
  } catch {
    return {
      residents: 0,
      rooms: 0,
      payments: 0,
      mode: "error" as const,
    }
  }
}
