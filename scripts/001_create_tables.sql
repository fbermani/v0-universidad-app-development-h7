-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de configuraciones
CREATE TABLE IF NOT EXISTS configurations (
    id TEXT PRIMARY KEY,
    exchange_rate DECIMAL(10,2) NOT NULL DEFAULT 1300,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    room_rates_usd JSONB NOT NULL DEFAULT '{"individual": 245, "double": 190, "triple": 165, "quadruple": 150, "quintuple": 135}',
    room_rates_ars JSONB NOT NULL DEFAULT '{"individual": 318500, "double": 247000, "triple": 214500, "quadruple": 195000, "quintuple": 175500}',
    payment_methods JSONB NOT NULL DEFAULT '["cash", "transfer"]',
    expense_categories JSONB NOT NULL DEFAULT '["Alquiler", "Aysa", "Luz", "ABL", "Wifi", "Seguro", "Compras Limpieza", "Meli", "Eduardo", "Honorarios Cont", "Mantenimiento Edu", "IIBB", "Mantenimiento", "Monotributo", "Publicidad", "Serv. Emergencias", "Fumig. y Limp. Tanques", "Inversión/Mejora"]',
    maintenance_areas JSONB NOT NULL DEFAULT '["Habitación", "Sala de Estar", "Escalera principal", "Escalera Terraza", "Pasillo", "Oficina", "Hall", "Cocina 1", "Cocina 2", "Cocina 3", "Baño 1", "Baño 2", "Baño 3", "Baño 4", "Baño 5", "Heladera 1", "Heladera 2", "Heladera 3", "Heladera 4"]',
    petty_cash DECIMAL(10,2) NOT NULL DEFAULT 50000,
    monthly_history JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de habitaciones
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('individual', 'double', 'triple', 'quadruple', 'quintuple')),
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    monthly_rate_usd DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de residentes
CREATE TABLE IF NOT EXISTS residents (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nationality TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    room_id TEXT REFERENCES rooms(id),
    check_in_date DATE,
    check_out_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    behavior_notes JSONB NOT NULL DEFAULT '[]',
    documents JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    resident_id TEXT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    matricula_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2),
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    resident_id TEXT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
    method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'card', 'petty_cash')),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('monthly_rent', 'matricula', 'deposit', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    receipt_number TEXT,
    is_partial_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
    method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'card', 'petty_cash')),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    receipt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tareas de mantenimiento
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id TEXT PRIMARY KEY,
    area TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_date DATE NOT NULL,
    completed_date DATE,
    photos JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de tarifas mensuales
CREATE TABLE IF NOT EXISTS monthly_rate_history (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL UNIQUE, -- Format: YYYY-MM
    exchange_rate DECIMAL(10,2) NOT NULL,
    room_rates_usd JSONB NOT NULL,
    room_rates_ars JSONB NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_residents_room_id ON residents(room_id);
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_payments_resident_id ON payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_resident_id ON reservations(resident_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_monthly_rate_history_month ON monthly_rate_history(month);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_tasks_updated_at BEFORE UPDATE ON maintenance_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto si no existe
INSERT INTO configurations (
    id,
    exchange_rate,
    room_rates_usd,
    room_rates_ars,
    payment_methods,
    expense_categories,
    maintenance_areas,
    petty_cash,
    monthly_history
) VALUES (
    'default-config-id',
    1300,
    '{"individual": 245, "double": 190, "triple": 165, "quadruple": 150, "quintuple": 135}',
    '{"individual": 318500, "double": 247000, "triple": 214500, "quadruple": 195000, "quintuple": 175500}',
    '["cash", "transfer"]',
    '["Alquiler", "Aysa", "Luz", "ABL", "Wifi", "Seguro", "Compras Limpieza", "Meli", "Eduardo", "Honorarios Cont", "Mantenimiento Edu", "IIBB", "Mantenimiento", "Monotributo", "Publicidad", "Serv. Emergencias", "Fumig. y Limp. Tanques", "Inversión/Mejora"]',
    '["Habitación", "Sala de Estar", "Escalera principal", "Escalera Terraza", "Pasillo", "Oficina", "Hall", "Cocina 1", "Cocina 2", "Cocina 3", "Baño 1", "Baño 2", "Baño 3", "Baño 4", "Baño 5", "Heladera 1", "Heladera 2", "Heladera 3", "Heladera 4"]',
    50000,
    '[]'
) ON CONFLICT (id) DO NOTHING;

-- Insertar residente "Ingreso General" si no existe
INSERT INTO residents (
    id,
    first_name,
    last_name,
    nationality,
    email,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    room_id,
    check_in_date,
    status,
    behavior_notes,
    documents
) VALUES (
    'general-income',
    'Ingreso',
    'General',
    'argentina',
    '',
    '',
    '',
    '',
    '',
    '',
    '2023-01-01',
    'active',
    '[]',
    '[]'
) ON CONFLICT (id) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente!';
    RAISE NOTICE 'Tablas creadas: configurations, rooms, residents, reservations, payments, expenses, maintenance_tasks, monthly_rate_history';
    RAISE NOTICE 'Configuración por defecto insertada';
    RAISE NOTICE 'Residente "Ingreso General" creado';
END $$;
