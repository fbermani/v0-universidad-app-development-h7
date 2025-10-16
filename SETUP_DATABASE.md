# Configuración de Base de Datos Supabase

Esta guía te ayudará a configurar Supabase para que la aplicación funcione con datos persistentes en lugar del modo demo.

## 🎯 Estado Actual

La aplicación está funcionando en **modo demo** con datos temporales. Para activar la persistencia real, sigue estos pasos:

## 📋 Requisitos Previos

- Cuenta gratuita en Supabase
- Acceso al código fuente de la aplicación
- Editor de texto para crear archivos de configuración

## 🚀 Paso 1: Crear Proyecto en Supabase

1. **Ir a Supabase Dashboard**
   - Visita [supabase.com/dashboard](https://supabase.com/dashboard)
   - Inicia sesión o crea una cuenta gratuita

2. **Crear Nuevo Proyecto**
   - Haz clic en "New Project"
   - Elige una organización (o crea una nueva)
   - Completa los datos:
     - **Name**: `resiapp` (o el nombre que prefieras)
     - **Database Password**: Genera una contraseña segura (guárdala)
     - **Region**: Elige la más cercana a tu ubicación
   - Haz clic en "Create new project"

3. **Esperar Inicialización**
   - El proyecto tardará 1-2 minutos en estar listo
   - Verás un indicador de progreso

## 🔑 Paso 2: Obtener Credenciales

1. **Ir a Project Settings**
   - En el dashboard del proyecto, ve a Settings → API

2. **Copiar las Credenciales**
   - **Project URL**: Copia la URL del proyecto
   - **anon/public key**: Copia la clave anon (pública)
   - **service_role key**: Copia la clave service_role (opcional pero recomendada)

## 📝 Paso 3: Configurar Variables de Entorno

1. **Crear Archivo .env.local**
   - En la raíz de tu proyecto, crea un archivo llamado `.env.local`

2. **Agregar las Variables**
   \`\`\`env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
   \`\`\`

3. **Reemplazar los Valores**
   - Sustituye `tu-proyecto-id` con tu ID real de proyecto
   - Sustituye `tu_clave_anon_aqui` con tu clave anon real
   - Sustituye `tu_clave_service_role_aqui` con tu clave service_role real

## 🗄️ Paso 4: Crear Tablas en la Base de Datos

1. **Ir al SQL Editor**
   - En el dashboard de Supabase, ve a SQL Editor

2. **Ejecutar el Script de Creación**
   - Copia y pega el contenido del archivo `scripts/001_create_tables.sql`
   - Haz clic en "Run" para ejecutar el script

3. **Verificar Creación**
   - Ve a Table Editor para confirmar que las tablas se crearon correctamente
   - Deberías ver: `residents`, `rooms`, `payments`, `expenses`, etc.

## 🔄 Paso 5: Reiniciar la Aplicación

1. **Detener el Servidor de Desarrollo**
   - Presiona `Ctrl+C` en la terminal donde corre la aplicación

2. **Reiniciar**
   \`\`\`bash
   npm run dev
   # o
   yarn dev
   \`\`\`

3. **Verificar Conexión**
   - Ve a Configuración → Base de Datos
   - Deberías ver el estado como "PRODUCCIÓN" y "Conectado"

## ✅ Verificación Final

### Indicadores de Éxito:
- ✅ Badge muestra "PRODUCCIÓN" en lugar de "DEMO"
- ✅ Estado de conexión muestra "Conectado"
- ✅ URL de Supabase muestra tu proyecto real
- ✅ Variables configuradas muestran checkmarks verdes

### Si algo no funciona:
1. **Verificar Variables de Entorno**
   - Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
   - Verifica que no haya espacios extra en las variables
   - Confirma que las credenciales sean correctas

2. **Verificar Conexión de Red**
   - Asegúrate de tener conexión a internet
   - Verifica que no haya firewall bloqueando Supabase

3. **Revisar Logs**
   - Abre las herramientas de desarrollador del navegador
   - Busca errores en la consola

## 🔧 Configuración Avanzada (Opcional)

### Row Level Security (RLS)
Si quieres mayor seguridad, puedes habilitar RLS en las tablas:

\`\`\`sql
-- Habilitar RLS en todas las tablas
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_rate_history ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas (permitir todo por ahora)
CREATE POLICY "Allow all operations" ON residents FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON configurations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON monthly_rate_history FOR ALL USING (true);
\`\`\`

### Backup Automático
Supabase hace backups automáticos, pero puedes configurar backups adicionales:
- Ve a Settings → Database
- Configura Point-in-time Recovery si lo necesitas

## 🆘 Solución de Problemas Comunes

### Error: "Invalid API key"
- Verifica que hayas copiado correctamente la clave anon
- Asegúrate de no haber incluido espacios extra

### Error: "Project not found"
- Verifica que la URL del proyecto sea correcta
- Confirma que el proyecto esté activo en Supabase

### Error: "Connection timeout"
- Verifica tu conexión a internet
- Intenta desde una red diferente

### Los datos no se guardan
- Confirma que el script SQL se ejecutó correctamente
- Verifica que las tablas existan en Table Editor

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador para errores específicos
2. Verifica el estado en Configuración → Base de Datos
3. Consulta la documentación de Supabase: [supabase.com/docs](https://supabase.com/docs)

---

Una vez completados estos pasos, tu aplicación estará funcionando con una base de datos real y persistente. ¡Todos los datos se guardarán automáticamente!
