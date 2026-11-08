-- ============================================================================
-- ApexTrack Enterprise Production Database Schema (PostgreSQL 16)
-- Sprint 15: Relational Persistence, Audit Logging & RBAC Control Tables
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: RBAC Roles & Capabilities
CREATE TABLE IF NOT EXISTS rbac_roles (
    role_name VARCHAR(32) PRIMARY KEY,
    description TEXT NOT NULL,
    is_elevated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO rbac_roles (role_name, description, is_elevated) VALUES
('ADMIN', 'Full administrative authority. Can purge telemetry, delete shipments, view audit trails.', TRUE),
('DISPATCHER', 'Operational logistics dispatcher. Can create, read, and update shipment statuses.', FALSE),
('VIEWER', 'Auditor & observer role. Strictly read-only privileges.', FALSE)
ON CONFLICT (role_name) DO NOTHING;

-- Table 2: User Registry
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) REFERENCES rbac_roles(role_name) ON DELETE RESTRICT,
    department VARCHAR(128) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Shipments (3NF Normalized)
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(64) PRIMARY KEY,
    tracking_number VARCHAR(32) UNIQUE NOT NULL,
    origin VARCHAR(128) NOT NULL,
    destination VARCHAR(128) NOT NULL,
    cargo_classification VARCHAR(64) NOT NULL,
    priority VARCHAR(32) DEFAULT 'STANDARD',
    target_temp_c NUMERIC(5,2) DEFAULT 20.00,
    current_temp_c NUMERIC(5,2) DEFAULT 20.00,
    weight_kg NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'DISPATCHED',
    assigned_vehicle VARCHAR(64),
    dispatcher VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-throughput querying
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_vehicle ON shipments(assigned_vehicle);

-- Table 4: IoT Telemetry Sensor Frames
CREATE TABLE IF NOT EXISTS telemetry_frames (
    id VARCHAR(64) PRIMARY KEY,
    vehicle_id VARCHAR(64) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    speed_kmh NUMERIC(6,2) DEFAULT 0.00,
    cargo_temp_c NUMERIC(5,2) DEFAULT 20.00,
    battery_percent INT DEFAULT 100,
    health_status VARCHAR(32) DEFAULT 'OPTIMAL',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle ON telemetry_frames(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_frames(timestamp DESC);

-- Table 5: Immutable Audit Ledger
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    actor VARCHAR(64) NOT NULL,
    target VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
