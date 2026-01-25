import { db } from '../index';

export interface StaffShiftRow {
  shift_id: string;
  date: string;
  role: string;
  shift_time: string | null;
  start_time: string | null;
  end_time: string | null;
  scheduled_count: number | null;
  actual_available: number | null;
  max_capacity: number | null;
  on_call_available: number | null;
  cost_per_hour: number | null;
  shortage: number | null;
  staffing_percentage: number | null;
  needs_on_call_activation: number | null;
  notes: string | null;
}

const getStaffByDate = db.prepare(`
  SELECT 
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
  FROM fact_staff_shift
  WHERE date = ?
  ORDER BY role ASC, shift_time ASC
`);

export function getStaffDay(date: string): StaffShiftRow[] {
  return getStaffByDate.all(date) as StaffShiftRow[];
}

const getStaffByDateRangeStmt = db.prepare(`
  SELECT 
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
  FROM fact_staff_shift
  WHERE date >= ? AND date <= ?
  ORDER BY date ASC, role ASC, shift_time ASC
`);

export function getStaffDateRange(from: string, to: string): StaffShiftRow[] {
  return getStaffByDateRangeStmt.all(from, to) as StaffShiftRow[];
}
