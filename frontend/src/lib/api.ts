const API_BASE_URL = 'https://proactive-pulse-backend.onrender.com';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ED Hourly Data
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

export function getEDHourly(from: string, to: string): Promise<EDHourlyRow[]> {
  return fetchApi(`/api/ui/ed/hourly?from=${from}&to=${to}`);
}

// Staff Schedule
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

export function getStaffDay(date: string): Promise<StaffShiftRow[]> {
  return fetchApi(`/api/ui/staff/day?date=${date}`);
}

// Inventory Risk
export interface InventoryRiskRow {
  sku_id: string;
  item_name: string | null;
  category: string | null;
  location_id: number | null;
  location_name: string | null;
  current_stock: number | null;
  par_level: number | null;
  burn_rate_daily: number | null;
  status: string | null;
  days_until_stockout: number | null;
  ts: string;
  date: string;
}

export function getInventoryRisk(days: number = 7): Promise<InventoryRiskRow[]> {
  return fetchApi(`/api/ui/inventory/risk?days=${days}`);
}

// All Inventory (no days filter)
export function getAllInventory(): Promise<InventoryRiskRow[]> {
  return fetchApi(`/api/ui/inventory/all`);
}

// Suppliers
export interface SupplierContractRow {
  contract_id: number;
  supplier_id: string;
  supplier_name: string | null;
  contract_type: string | null;
  sku_id: string;
  item_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  min_order_qty: number | null;
  notes: string | null;
}

export function getSuppliersBySku(skuId: string): Promise<SupplierContractRow[]> {
  return fetchApi(`/api/ui/suppliers/by-sku/${skuId}`);
}

export function getSuppliersBySkus(skuIds: string[]): Promise<SupplierContractRow[]> {
  return fetchApi('/api/ui/suppliers/by-skus', {
    method: 'POST',
    body: JSON.stringify({ sku_ids: skuIds }),
  });
}

// All Suppliers (unique)
export interface SupplierRow {
  supplier_id: string;
  supplier_name: string | null;
  category: string | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  primary_products: string[];
}

export function getAllSuppliers(): Promise<SupplierRow[]> {
  return fetchApi('/api/ui/suppliers/all');
}

// Events (Past Incidents)
export interface EventRow {
  event_id: string;
  date: string;
  event_type: string;
  severity_index: number | null;
  patient_volume_spike: number | null;
  top_clinical_categories: string | null;
  critical_supplies_depleted: string | null;
}

export function getEvents(from: string, to: string): Promise<EventRow[]> {
  return fetchApi(`/api/ui/events?from=${from}&to=${to}`);
}

// Health Check
export function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchApi('/health');
}

// ============================================================================
// PAGINATED TYPES
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// PATIENT DATA
// ============================================================================

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

export function getPatients(
  page: number = 1,
  limit: number = 20,
  from?: string,
  to?: string
): Promise<PaginatedResult<PatientRow>> {
  let url = `/api/ui/patients?page=${page}&limit=${limit}`;
  if (from && to) {
    url += `&from=${from}&to=${to}`;
  }
  return fetchApi(url);
}

export function getPatientById(id: number): Promise<PatientRow> {
  return fetchApi(`/api/ui/patients/${id}`);
}

// ============================================================================
// ED HOURLY PAGINATED
// ============================================================================

export function getEDHourlyPaginated(
  from: string,
  to: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResult<EDHourlyRow>> {
  return fetchApi(`/api/ui/ed/hourly/paginated?from=${from}&to=${to}&page=${page}&limit=${limit}`);
}

// ============================================================================
// PURCHASE WORKFLOW
// ============================================================================

export interface PendingPurchaseRow {
  id: number;
  sku_id: string;
  item_name: string | null;
  category: string | null;
  quantity: number;
  supplier_id: string;
  supplier_name: string | null;
  unit_price: number | null;
  total_cost: number | null;
  status: string;
  reason: string | null;
  urgency: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRow {
  id: number;
  sku_id: string;
  item_name: string | null;
  category: string | null;
  quantity: number;
  supplier_id: string;
  supplier_name: string | null;
  unit_price: number | null;
  total_cost: number | null;
  status: string;
  reason: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface InventoryForOrderingRow {
  sku_id: string;
  item_name: string | null;
  category: string | null;
  supplier_id: string;
  supplier_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  min_order_qty: number | null;
}

export function getPendingPurchases(): Promise<PendingPurchaseRow[]> {
  return fetchApi('/api/ui/purchases/pending');
}

export function getApprovedPurchases(): Promise<PurchaseRow[]> {
  return fetchApi('/api/ui/purchases/approved');
}

export function getInventoryForOrdering(): Promise<InventoryForOrderingRow[]> {
  return fetchApi('/api/ui/inventory/for-ordering');
}

export interface CreatePurchaseInput {
  sku_id: string;
  quantity: number;
  supplier_id: string;
  reason?: string;
  urgency?: string;
}

export function createPendingPurchase(input: CreatePurchaseInput): Promise<{ id: number; message: string }> {
  return fetchApi('/api/ui/purchases/create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function approvePurchase(id: number): Promise<{ id: number; message: string }> {
  return fetchApi(`/api/ui/purchases/${id}/approve`, {
    method: 'POST',
  });
}

export function rejectPurchase(id: number): Promise<{ message: string }> {
  return fetchApi(`/api/ui/purchases/${id}/reject`, {
    method: 'POST',
  });
}

export function getRejectedPurchases(): Promise<PendingPurchaseRow[]> {
  return fetchApi('/api/ui/purchases/rejected');
}

export interface SupplierComparisonRow {
  supplier_id: string;
  supplier_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  contract_type: string | null;
  min_order_qty: number | null;
  is_primary: number;
}

export function getSupplierOptionsForPurchase(purchaseId: number): Promise<SupplierComparisonRow[]> {
  return fetchApi(`/api/ui/purchases/${purchaseId}/supplier-options`);
}

export function updatePurchaseSupplier(purchaseId: number, supplierId: string, quantity?: number): Promise<{ message: string }> {
  return fetchApi(`/api/ui/purchases/${purchaseId}/update-supplier`, {
    method: 'POST',
    body: JSON.stringify({ supplier_id: supplierId, quantity }),
  });
}
