import { db } from '../index';

export interface EventRow {
  event_id: string;
  date: string;
  event_type: string;
  severity_index: number | null;
  patient_volume_spike: number | null;
  top_clinical_categories: string | null;
  critical_supplies_depleted: string | null;
}

const getEventsByDateRange = db.prepare(`
  SELECT 
    event_id,
    date,
    event_type,
    severity_index,
    patient_volume_spike,
    top_clinical_categories,
    critical_supplies_depleted
  FROM fact_event
  WHERE date >= ? AND date <= ?
  ORDER BY date DESC, severity_index DESC
`);

export function getEvents(from: string, to: string): EventRow[] {
  return getEventsByDateRange.all(from, to) as EventRow[];
}
