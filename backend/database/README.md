# Database Setup Instructions

## Quick Start - Initialize Database (Complete Setup)

Run these commands in order from the project root directory:

```bash
# Step 1: Create database and apply schema migration
sqlite3 forecasting.db < database/migration.sql

# Step 2: Load CSV data into raw tables (use --skip 1 if CSV files have headers)
sqlite3 forecasting.db <<EOF
.mode csv
.import --skip 1 database/csv-data/supplier_contracts.csv raw_supplier_contract
.import --skip 1 database/csv-data/staffing_schedule.csv raw_staff_schedule
.import --skip 1 database/csv-data/patient_data.csv raw_patient_data
.import --skip 1 database/csv-data/historical_events.csv raw_historical_events
.import --skip 1 database/csv-data/ed_hourly_snapshots.csv raw_ed_hourly_snapshot
.import --skip 1 database/csv-data/current_inventory.csv raw_current_inventory
EOF

# Step 3: Seed dimension tables from raw data
sqlite3 forecasting.db < database/seed_dimensions.sql

# Step 4: Transform raw data to fact tables (ETL)
sqlite3 forecasting.db < database/etl_facts.sql

# Step 5: Verify setup (optional)
sqlite3 forecasting.db "SELECT COUNT(*) as raw_contracts FROM raw_supplier_contract; SELECT COUNT(*) as items FROM dim_item; SELECT COUNT(*) as suppliers FROM dim_supplier; SELECT COUNT(*) as ed_hourly FROM fact_ed_hourly; SELECT COUNT(*) as staff_shifts FROM fact_staff_shift;"

# Step 6: Open database to explore
sqlite3 forecasting.db
```

**Note:** If your CSV files don't have headers, remove `--skip 1` from the import commands in Step 2.

---

## Detailed Instructions

### Apply Migration

```bash
sqlite3 forecasting.db < database/migration.sql
```

## Load CSV Data into Raw Tables

```bash
sqlite3 forecasting.db <<EOF
.mode csv
.import database/csv-data/supplier_contracts.csv raw_supplier_contract
.import database/csv-data/staffing_schedule.csv raw_staff_schedule
.import database/csv-data/patient_data.csv raw_patient_data
.import database/csv-data/historical_events.csv raw_historical_events
.import database/csv-data/ed_hourly_snapshots.csv raw_ed_hourly_snapshot
.import database/csv-data/current_inventory.csv raw_current_inventory
EOF
```

**Note:** If your CSV files have headers, skip the first row:
```bash
sqlite3 forecasting.db <<EOF
.mode csv
.import --skip 1 database/csv-data/supplier_contracts.csv raw_supplier_contract
.import --skip 1 database/csv-data/staffing_schedule.csv raw_staff_schedule
.import --skip 1 database/csv-data/patient_data.csv raw_patient_data
.import --skip 1 database/csv-data/historical_events.csv raw_historical_events
.import --skip 1 database/csv-data/ed_hourly_snapshots.csv raw_ed_hourly_snapshot
.import --skip 1 database/csv-data/current_inventory.csv raw_current_inventory
EOF
```

## Seed Dimension Tables

```bash
sqlite3 forecasting.db < database/seed_dimensions.sql
```

## Transform Raw Data to Fact Tables (ETL)

**Important:** Run this after seeding dimensions to populate fact tables for API queries.

```bash
sqlite3 forecasting.db < database/etl_facts.sql
```

This script:
- Transforms `raw_ed_hourly_snapshot` → `fact_ed_hourly`
- Transforms `raw_staff_schedule` → `fact_staff_shift`
- Transforms `raw_current_inventory` → `fact_inventory_snapshot`
- Transforms `raw_historical_events` → `fact_event`
- Transforms `raw_patient_data` → `fact_encounter` (optional)
- Transforms `raw_supplier_contract` → `fact_supplier_contract` (optional)

## Verify Setup

```bash
sqlite3 forecasting.db "SELECT COUNT(*) FROM raw_supplier_contract;"
sqlite3 forecasting.db "SELECT COUNT(*) FROM dim_item;"
sqlite3 forecasting.db "SELECT COUNT(*) FROM dim_supplier;"
```

## Explore the Database

### Open the Database Interactively

```bash
sqlite3 forecasting.db
```

### Useful Commands Inside SQLite

Once inside the SQLite prompt, you can use these commands:

```sql
-- List all tables
.tables

-- Show schema for a specific table
.schema raw_supplier_contract
.schema dim_item
.schema fact_ed_hourly

-- Show all table schemas
.schema

-- Set output mode for better readability
.mode column
.headers on

-- View sample data from a table
SELECT * FROM dim_item LIMIT 10;
SELECT * FROM raw_supplier_contract LIMIT 5;
SELECT * FROM dim_supplier;

-- Count rows in each table
SELECT 'raw_supplier_contract' as table_name, COUNT(*) as row_count FROM raw_supplier_contract
UNION ALL
SELECT 'raw_staff_schedule', COUNT(*) FROM raw_staff_schedule
UNION ALL
SELECT 'raw_patient_data', COUNT(*) FROM raw_patient_data
UNION ALL
SELECT 'raw_historical_events', COUNT(*) FROM raw_historical_events
UNION ALL
SELECT 'raw_ed_hourly_snapshot', COUNT(*) FROM raw_ed_hourly_snapshot
UNION ALL
SELECT 'raw_current_inventory', COUNT(*) FROM raw_current_inventory
UNION ALL
SELECT 'dim_item', COUNT(*) FROM dim_item
UNION ALL
SELECT 'dim_supplier', COUNT(*) FROM dim_supplier
UNION ALL
SELECT 'dim_role', COUNT(*) FROM dim_role
UNION ALL
SELECT 'dim_location', COUNT(*) FROM dim_location
UNION ALL
SELECT 'dim_clinical_category', COUNT(*) FROM dim_clinical_category
UNION ALL
SELECT 'dim_event_type', COUNT(*) FROM dim_event_type;

-- Exit SQLite
.quit
```

### Quick One-Line Queries (from terminal)

```bash
# List all tables
sqlite3 forecasting.db ".tables"

# Show schema for all tables
sqlite3 forecasting.db ".schema"

# View sample data
sqlite3 forecasting.db "SELECT * FROM dim_item LIMIT 10;"

# Count rows in a table
sqlite3 forecasting.db "SELECT COUNT(*) FROM raw_supplier_contract;"
```
