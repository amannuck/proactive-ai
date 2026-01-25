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

const getPatientCountStmt = db.prepare(`
  SELECT COUNT(*) as count FROM fact_encounter
`);

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

export function getPatients(page: number = 1, limit: number = 20): PaginatedResult<PatientRow> {
  const offset = (page - 1) * limit;
  const countResult = getPatientCountStmt.get() as { count: number };
  const total = countResult.count;
  const data = getPatientsStmt.all(limit, offset) as PatientRow[];
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

const getPatientsByDateRangeCountStmt = db.prepare(`
  SELECT COUNT(*) as count 
  FROM fact_encounter
  WHERE date(ts_admit) >= ? AND date(ts_admit) <= ?
`);

export function getPatientsByDateRange(
  from: string,
  to: string,
  page: number = 1,
  limit: number = 20
): PaginatedResult<PatientRow> {
  const offset = (page - 1) * limit;
  
  const countResult = getPatientsByDateRangeCountStmt.get(from, to) as { count: number };
  const total = countResult.count;
  
  const query = db.prepare(`
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
  
  const data = query.all(from, to, limit, offset) as PatientRow[];
  
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
