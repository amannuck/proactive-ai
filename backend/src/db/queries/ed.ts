import { db } from '../index';

export interface EDHourlyRow {
  ts: string;
  date: string;
  hour: number;
  arrivals_last_hour: number | null;
  departures_last_hour: number | null;
  ambulance_arrivals: number | null;
  waiting_patients: number | null;
  patients_in_treatment: number | null;
  admitted_patients_boarding: number | null;
  md_count: number | null;
  nurse_count: number | null;
  clerk_count: number | null;
  bed_occupancy_pct: number | null;
  bed_saturation_index: number | null;
  longest_wait_time_min: number | null;
}

const getHourlyByDateRange = db.prepare(`
  SELECT 
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
  FROM fact_ed_hourly
  WHERE date >= ? AND date <= ?
  ORDER BY date ASC, hour ASC
`);

export function getEDHourly(from: string, to: string): EDHourlyRow[] {
  return getHourlyByDateRange.all(from, to) as EDHourlyRow[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getEDHourlyPaginated(
  from: string,
  to: string,
  page: number = 1,
  limit: number = 50
): PaginatedResult<EDHourlyRow> {
  const offset = (page - 1) * limit;
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as count 
    FROM fact_ed_hourly
    WHERE date >= ? AND date <= ?
  `).get(from, to) as { count: number };
  const total = countResult.count;
  
  const data = db.prepare(`
    SELECT 
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
    FROM fact_ed_hourly
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC, hour DESC
    LIMIT ? OFFSET ?
  `).all(from, to, limit, offset) as EDHourlyRow[];
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
