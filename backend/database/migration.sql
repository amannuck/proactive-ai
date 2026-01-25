-- SQLite Migration: Forecasting + Analytics System
-- Design: Raw ingestion tables + Dimension tables + Fact tables
-- Purpose: Support time-series forecasting and dashboard queries with ability to reprocess raw data

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- RAW INGESTION TABLES
-- ============================================================================
-- Purpose: Store raw CSV data as-is (all TEXT) for flexible reprocessing
-- These tables act as staging areas before transformation into fact/dimension tables
-- The ingested_at timestamp tracks when data was loaded for audit/reprocessing

CREATE TABLE raw_supplier_contract (
    supplier_id TEXT,
    supplier_name TEXT,
    contract_type TEXT,
    item_sku TEXT,
    item_name TEXT,
    price_per_unit TEXT,
    lead_time_hours TEXT,
    reliability_score TEXT,
    min_order_qty TEXT,
    notes TEXT,
    ingested_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE raw_staff_schedule (
    shift_id TEXT,
    date TEXT,
    shift_time TEXT,
    start_time TEXT,
    end_time TEXT,
    role TEXT,
    scheduled_count TEXT,
    actual_available TEXT,
    max_capacity TEXT,
    on_call_available TEXT,
    cost_per_hour TEXT,
    shortage TEXT,
    notes TEXT,
    staffing_percentage TEXT,
    needs_on_call_activation TEXT,
    ingested_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE raw_patient_data (
    ohip_number TEXT,
    admission_date TEXT,
    age TEXT,
    sex TEXT,
    admission_reason TEXT,
    clinical_category TEXT,
    treatment_performed TEXT,
    supplies_depleted TEXT,
    time_admission TEXT,
    time_discharge TEXT,
    surgery TEXT,
    critical_condition TEXT,
    triage_level TEXT,
    arrival_mode TEXT,
    time_triage_complete TEXT,
    time_seen_by_md TEXT,
    icd_10_code TEXT,
    comorbidities TEXT,
    ingested_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE raw_historical_events (
    event_id TEXT,
    date TEXT,
    event_type TEXT,
    severity_index TEXT,
    patient_volume_spike TEXT,
    top_clinical_categories TEXT,
    critical_supplies_depleted TEXT,
    ingested_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE raw_ed_hourly_snapshot (
    timestamp TEXT,
    date_str TEXT,
    time_str TEXT,
    hour_of_day TEXT,
    arrivals_last_hour TEXT,
    departures_last_hour TEXT,
    ambulance_arrivals TEXT,
    waiting_patients TEXT,
    patients_in_treatment TEXT,
    admitted_patients_boarding TEXT,
    md_count TEXT,
    nurse_count TEXT,
    clerk_count TEXT,
    bed_occupancy_pct TEXT,
    bed_saturation_index TEXT,
    longest_wait_time_min TEXT,
    ingested_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE raw_current_inventory (
    sku_id TEXT,
    item_name TEXT,
    category TEXT,
    current_stock TEXT,
    par_level TEXT,
    burn_rate_daily TEXT,
    location TEXT,
    status TEXT,
    ingested_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================================
-- DIMENSION TABLES
-- ============================================================================
-- Purpose: Normalized lookup tables for referential integrity and consistent reporting
-- Dimensions enable efficient joins and ensure data consistency across fact tables

CREATE TABLE dim_item (
    sku_id TEXT PRIMARY KEY,
    item_name TEXT,
    category TEXT,
    notes TEXT
);

CREATE TABLE dim_supplier (
    supplier_id TEXT PRIMARY KEY,
    supplier_name TEXT UNIQUE
);

CREATE TABLE dim_role (
    role TEXT PRIMARY KEY
);

CREATE TABLE dim_location (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT UNIQUE
);

CREATE TABLE dim_clinical_category (
    clinical_category TEXT PRIMARY KEY
);

CREATE TABLE dim_event_type (
    event_type TEXT PRIMARY KEY
);

-- ============================================================================
-- FACT TABLES
-- ============================================================================
-- Purpose: Optimized tables for analytics and forecasting queries
-- Fact tables store transformed, typed data with proper relationships to dimensions
-- Indexes are added for common query patterns (time-series, filtering, aggregations)

-- Supplier contracts: tracks pricing, lead times, and reliability by supplier-item
CREATE TABLE fact_supplier_contract (
    contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id TEXT NOT NULL,
    contract_type TEXT,
    sku_id TEXT NOT NULL,
    price_per_unit REAL,
    lead_time_hours INTEGER,
    reliability_score REAL,
    min_order_qty INTEGER,
    notes TEXT,
    UNIQUE(supplier_id, contract_type, sku_id),
    FOREIGN KEY (supplier_id) REFERENCES dim_supplier(supplier_id),
    FOREIGN KEY (sku_id) REFERENCES dim_item(sku_id)
);

-- ED hourly metrics: time-series data for forecasting patient flow and resource needs
CREATE TABLE fact_ed_hourly (
    ts TEXT PRIMARY KEY,  -- ISO8601 hour bucket (e.g., '2024-01-15T14:00:00Z')
    date TEXT NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    arrivals_last_hour INTEGER,
    departures_last_hour INTEGER,
    ambulance_arrivals INTEGER,
    waiting_patients INTEGER,
    patients_in_treatment INTEGER,
    admitted_patients_boarding INTEGER,
    md_count INTEGER,
    nurse_count INTEGER,
    clerk_count INTEGER,
    bed_occupancy_pct REAL,
    bed_saturation_index REAL,
    longest_wait_time_min INTEGER
);

CREATE INDEX idx_fact_ed_hourly_date_hour ON fact_ed_hourly(date, hour);

-- Staff shifts: tracks staffing levels, costs, and shortages by role and shift
CREATE TABLE fact_staff_shift (
    shift_id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    role TEXT NOT NULL,
    shift_time TEXT,
    start_time TEXT,
    end_time TEXT,
    scheduled_count INTEGER,
    actual_available INTEGER,
    max_capacity INTEGER,
    on_call_available INTEGER,
    cost_per_hour REAL,
    shortage INTEGER,
    staffing_percentage REAL,
    needs_on_call_activation INTEGER CHECK (needs_on_call_activation IN (0, 1)),
    notes TEXT,
    UNIQUE(date, role, shift_time),
    FOREIGN KEY (role) REFERENCES dim_role(role)
);

CREATE INDEX idx_fact_staff_shift_date_role ON fact_staff_shift(date, role);

-- Inventory snapshots: time-series inventory levels for demand forecasting
CREATE TABLE fact_inventory_snapshot (
    ts TEXT NOT NULL,
    date TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    location_id INTEGER,
    current_stock INTEGER,
    par_level INTEGER,
    burn_rate_daily REAL,
    status TEXT,
    PRIMARY KEY (ts, sku_id, location_id),
    FOREIGN KEY (sku_id) REFERENCES dim_item(sku_id),
    FOREIGN KEY (location_id) REFERENCES dim_location(location_id)
);

CREATE INDEX idx_fact_inventory_snapshot_date_sku ON fact_inventory_snapshot(date, sku_id);

-- Patient encounters: individual patient visits for clinical analytics
CREATE TABLE fact_encounter (
    encounter_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ohip_number TEXT,
    ts_admit TEXT,  -- ISO8601 timestamp
    ts_discharge TEXT,  -- ISO8601 timestamp (nullable)
    age INTEGER,
    sex TEXT,
    clinical_category TEXT,
    triage_level INTEGER,
    arrival_mode TEXT,
    icd_10_code TEXT,
    critical_condition INTEGER CHECK (critical_condition IN (0, 1)),
    surgery INTEGER CHECK (surgery IN (0, 1)),
    supplies_depleted TEXT,
    comorbidities TEXT,
    FOREIGN KEY (clinical_category) REFERENCES dim_clinical_category(clinical_category)
);

CREATE INDEX idx_fact_encounter_ts_admit ON fact_encounter(ts_admit);
CREATE INDEX idx_fact_encounter_clinical_category ON fact_encounter(clinical_category);

-- Historical events: external events that impact patient volume and supply needs
CREATE TABLE fact_event (
    event_id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity_index REAL,
    patient_volume_spike REAL,
    top_clinical_categories TEXT,
    critical_supplies_depleted TEXT,
    FOREIGN KEY (event_type) REFERENCES dim_event_type(event_type)
);

CREATE INDEX idx_fact_event_date ON fact_event(date);
CREATE INDEX idx_fact_event_event_type ON fact_event(event_type);
