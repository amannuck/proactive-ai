-- ETL Script: Transform Raw Data to Fact Tables
-- Purpose: Populate fact tables from raw ingestion tables
-- Run this after loading CSVs and seeding dimensions

PRAGMA foreign_keys = ON;

-- ============================================================================
-- FACT_ED_HOURLY
-- ============================================================================
-- Transform raw_ed_hourly_snapshot to fact_ed_hourly
-- Convert timestamp to ISO8601 hour bucket, parse numeric fields

INSERT OR REPLACE INTO fact_ed_hourly (
    ts,
    date,
    hour,
    arrivals_last_hour,
    departures_last_hour,
    ambulance_arrivals,
    waiting_patients,
    patients_in_treatment,
    admitted_patients_boarding,
    md_count,
    nurse_count,
    clerk_count,
    bed_occupancy_pct,
    bed_saturation_index,
    longest_wait_time_min
)
SELECT 
    -- Create ISO8601 hour bucket from date_str and hour_of_day
    CASE 
        WHEN date_str IS NOT NULL AND hour_of_day IS NOT NULL 
        THEN date_str || 'T' || printf('%02d', CAST(hour_of_day AS INTEGER)) || ':00:00Z'
        ELSE timestamp
    END as ts,
    date_str as date,
    CAST(hour_of_day AS INTEGER) as hour,
    CAST(arrivals_last_hour AS INTEGER) as arrivals_last_hour,
    CAST(departures_last_hour AS INTEGER) as departures_last_hour,
    CAST(ambulance_arrivals AS INTEGER) as ambulance_arrivals,
    CAST(waiting_patients AS INTEGER) as waiting_patients,
    CAST(patients_in_treatment AS INTEGER) as patients_in_treatment,
    CAST(admitted_patients_boarding AS INTEGER) as admitted_patients_boarding,
    CAST(md_count AS INTEGER) as md_count,
    CAST(nurse_count AS INTEGER) as nurse_count,
    CAST(clerk_count AS INTEGER) as clerk_count,
    CAST(bed_occupancy_pct AS REAL) as bed_occupancy_pct,
    CAST(bed_saturation_index AS REAL) as bed_saturation_index,
    CAST(longest_wait_time_min AS INTEGER) as longest_wait_time_min
FROM raw_ed_hourly_snapshot
WHERE date_str IS NOT NULL 
  AND hour_of_day IS NOT NULL
  AND hour_of_day != '';

-- ============================================================================
-- FACT_STAFF_SHIFT
-- ============================================================================
-- Transform raw_staff_schedule to fact_staff_shift
-- Parse numeric fields and handle boolean flags

INSERT OR REPLACE INTO fact_staff_shift (
    shift_id,
    date,
    role,
    shift_time,
    start_time,
    end_time,
    scheduled_count,
    actual_available,
    max_capacity,
    on_call_available,
    cost_per_hour,
    shortage,
    staffing_percentage,
    needs_on_call_activation,
    notes
)
SELECT 
    shift_id,
    date,
    role,
    shift_time,
    start_time,
    end_time,
    CAST(scheduled_count AS INTEGER) as scheduled_count,
    CAST(actual_available AS INTEGER) as actual_available,
    CAST(max_capacity AS INTEGER) as max_capacity,
    CAST(on_call_available AS INTEGER) as on_call_available,
    CAST(cost_per_hour AS REAL) as cost_per_hour,
    CAST(shortage AS INTEGER) as shortage,
    CAST(staffing_percentage AS REAL) as staffing_percentage,
    CASE 
        WHEN needs_on_call_activation IN ('1', 'true', 'True', 'TRUE', 'yes', 'Yes', 'YES') THEN 1
        WHEN needs_on_call_activation IN ('0', 'false', 'False', 'FALSE', 'no', 'No', 'NO') THEN 0
        ELSE CAST(needs_on_call_activation AS INTEGER)
    END as needs_on_call_activation,
    notes
FROM raw_staff_schedule
WHERE date IS NOT NULL 
  AND date != ''
  AND role IS NOT NULL 
  AND role != '';

-- ============================================================================
-- FACT_INVENTORY_SNAPSHOT
-- ============================================================================
-- Transform raw_current_inventory to fact_inventory_snapshot
-- Map location names to location_id, parse numeric fields

INSERT OR REPLACE INTO fact_inventory_snapshot (
    ts,
    date,
    sku_id,
    location_id,
    current_stock,
    par_level,
    burn_rate_daily,
    status
)
SELECT 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now') as ts,
    strftime('%Y-%m-%d', 'now') as date,
    sku_id,
    dl.location_id,
    CAST(current_stock AS INTEGER) as current_stock,
    CAST(par_level AS INTEGER) as par_level,
    CAST(burn_rate_daily AS REAL) as burn_rate_daily,
    status
FROM raw_current_inventory rci
LEFT JOIN dim_location dl ON rci.location = dl.location_name
WHERE sku_id IS NOT NULL 
  AND sku_id != '';

-- ============================================================================
-- FACT_EVENT
-- ============================================================================
-- Transform raw_historical_events to fact_event
-- Parse numeric fields

INSERT OR REPLACE INTO fact_event (
    event_id,
    date,
    event_type,
    severity_index,
    patient_volume_spike,
    top_clinical_categories,
    critical_supplies_depleted
)
SELECT 
    event_id,
    date,
    event_type,
    CAST(severity_index AS REAL) as severity_index,
    CAST(patient_volume_spike AS REAL) as patient_volume_spike,
    top_clinical_categories,
    critical_supplies_depleted
FROM raw_historical_events
WHERE event_id IS NOT NULL 
  AND event_id != ''
  AND date IS NOT NULL 
  AND date != ''
  AND event_type IS NOT NULL 
  AND event_type != '';

-- ============================================================================
-- FACT_ENCOUNTER (Optional - if needed)
-- ============================================================================
-- Transform raw_patient_data to fact_encounter
-- Parse timestamps, numeric fields, and boolean flags

INSERT OR REPLACE INTO fact_encounter (
    ohip_number,
    ts_admit,
    ts_discharge,
    age,
    sex,
    clinical_category,
    triage_level,
    arrival_mode,
    icd_10_code,
    critical_condition,
    surgery,
    supplies_depleted,
    comorbidities
)
SELECT 
    ohip_number,
    CASE
        WHEN admission_date IS NULL OR admission_date = '' OR time_admission IS NULL OR time_admission = '' THEN NULL
        ELSE strftime('%Y-%m-%dT%H:%M:%SZ', datetime(admission_date || ' ' || time_admission))
    END as ts_admit,
    CASE
        WHEN admission_date IS NULL OR admission_date = '' OR time_admission IS NULL OR time_admission = '' OR time_discharge IS NULL OR time_discharge = '' THEN NULL
        ELSE (
            CASE
                WHEN datetime(admission_date || ' ' || time_discharge) < datetime(admission_date || ' ' || time_admission)
                THEN strftime('%Y-%m-%dT%H:%M:%SZ', datetime(admission_date || ' ' || time_discharge, '+1 day'))
                ELSE strftime('%Y-%m-%dT%H:%M:%SZ', datetime(admission_date || ' ' || time_discharge))
            END
        )
    END as ts_discharge,
    CAST(age AS INTEGER) as age,
    sex,
    clinical_category,
    CAST(triage_level AS INTEGER) as triage_level,
    arrival_mode,
    icd_10_code,
    CASE 
        WHEN critical_condition IN ('1', 'true', 'True', 'TRUE', 'yes', 'Yes', 'YES') THEN 1
        WHEN critical_condition IN ('0', 'false', 'False', 'FALSE', 'no', 'No', 'NO') THEN 0
        ELSE CAST(critical_condition AS INTEGER)
    END as critical_condition,
    CASE 
        WHEN surgery IN ('1', 'true', 'True', 'TRUE', 'yes', 'Yes', 'YES') THEN 1
        WHEN surgery IN ('0', 'false', 'False', 'FALSE', 'no', 'No', 'NO') THEN 0
        ELSE CAST(surgery AS INTEGER)
    END as surgery,
    supplies_depleted,
    comorbidities
FROM raw_patient_data
WHERE ohip_number IS NOT NULL 
  AND ohip_number != '';

-- ============================================================================
-- FACT_SUPPLIER_CONTRACT (Optional - if needed)
-- ============================================================================
-- Transform raw_supplier_contract to fact_supplier_contract
-- Parse numeric fields

INSERT OR REPLACE INTO fact_supplier_contract (
    supplier_id,
    contract_type,
    sku_id,
    price_per_unit,
    lead_time_hours,
    reliability_score,
    min_order_qty,
    notes
)
SELECT 
    supplier_id,
    contract_type,
    item_sku as sku_id,
    CAST(price_per_unit AS REAL) as price_per_unit,
    CAST(lead_time_hours AS INTEGER) as lead_time_hours,
    CAST(reliability_score AS REAL) as reliability_score,
    CAST(min_order_qty AS INTEGER) as min_order_qty,
    notes
FROM raw_supplier_contract
WHERE supplier_id IS NOT NULL 
  AND supplier_id != ''
  AND item_sku IS NOT NULL 
  AND item_sku != '';
