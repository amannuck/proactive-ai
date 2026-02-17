import { db } from '../index';

export interface PatientRow {
  encounter_id: number;
  ohip_number: string | null;
  ts_admit: string | null;
  ts_discharge: string | null;
  age: number | null;
  sex: string | null;
  clinical_category: string | null;
  triage_level: number | null;
  arrival_mode: string | null;
  icd_10_code: string | null;
  critical_condition: number | null;
  surgery: number | null;
  supplies_depleted: string | null;
  comorbidities: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Cached total estimate - updated periodically instead of on every request
let cachedTotal: number | null = null;
let lastCountTime = 0;
const COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getPatientsStmt = db.prepare(`
  SELECT 
    encounter_id,
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
  FROM fact_encounter
  ORDER BY ts_admit DESC
  LIMIT ? OFFSET ?
`);

function getCachedTotal(): number {
  const now = Date.now();
  // Use cached value if recent
  if (cachedTotal !== null && (now - lastCountTime) < COUNT_CACHE_TTL) {
    return cachedTotal;
  }
  
  // Refresh cache
  const countResult = db.prepare('SELECT COUNT(*) as count FROM fact_encounter').get() as { count: number };
  cachedTotal = countResult.count;
  lastCountTime = now;
  return cachedTotal;
}

export function getPatients(page: number = 1, limit: number = 20): PaginatedResult<PatientRow> {
  const offset = (page - 1) * limit;
  const total = getCachedTotal();
  const data = getPatientsStmt.all(limit, offset) as PatientRow[];
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getPatientsByDateRange(
  from: string,
  to: string,
  page: number = 1,
  limit: number = 20
): PaginatedResult<PatientRow> {
  const offset = (page - 1) * limit;
  
  // First, get the data while counting results in same pass
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM fact_encounter
    WHERE date(ts_admit) >= ? AND date(ts_admit) <= ?
  `);
  
  const countResult = countStmt.get(from, to) as { count: number };
  const total = countResult.count;
  
  const dataStmt = db.prepare(`
    SELECT 
      encounter_id,
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
    FROM fact_encounter
    WHERE date(ts_admit) >= ? AND date(ts_admit) <= ?
    ORDER BY ts_admit DESC
    LIMIT ? OFFSET ?
  `);
  
  const data = dataStmt.all(from, to, limit, offset) as PatientRow[];
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

const getPatientByIdStmt = db.prepare(`
  SELECT 
    encounter_id,
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
  FROM fact_encounter
  WHERE encounter_id = ?
`);

export function getPatientById(encounterId: number): PatientRow | null {
  return getPatientByIdStmt.get(encounterId) as PatientRow | null;
}
