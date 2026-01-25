import { Router } from 'express';
import { getEDHourly, getEDHourlyPaginated } from '../db/queries/ed';
import { getStaffDay, getStaffDateRange } from '../db/queries/staff';
import { getInventoryRiskByDays, getAllInventory } from '../db/queries/inventory';
import { getSuppliersBySkuId, getSuppliersBySkuIds, getAllSuppliers } from '../db/queries/supplier';
import { getEvents } from '../db/queries/events';
import { getPatients, getPatientsByDateRange, getPatientById } from '../db/queries/patients';
import { 
  getPendingPurchases, 
  getApprovedPurchases, 
  createPendingPurchase, 
  approvePendingPurchase, 
  rejectPendingPurchase,
  getInventoryForOrdering,
  getSupplierOptionsForSku,
  updatePendingPurchaseSupplier,
  getRejectedPurchases
} from '../db/queries/purchases';

const router = Router();

router.get('/ed/hourly', (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required query params: from, to' });
  }

  try {
    const data = getEDHourly(from, to);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ED hourly data', details: String(error) });
  }
});

router.get('/staff/day', (req, res) => {
  const date = req.query.date as string;

  if (!date) {
    return res.status(400).json({ error: 'Missing required query param: date' });
  }

  try {
    const data = getStaffDay(date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff data', details: String(error) });
  }
});

router.get('/inventory/risk', (req, res) => {
  const daysParam = req.query.days as string;
  const days = daysParam ? parseInt(daysParam, 10) : 7;

  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Invalid days parameter' });
  }

  try {
    const data = getInventoryRiskByDays(days);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory risk data', details: String(error) });
  }
});

router.get('/suppliers/by-sku/:skuId', (req, res) => {
  const skuId = req.params.skuId;

  if (!skuId) {
    return res.status(400).json({ error: 'Missing required param: skuId' });
  }

  try {
    const data = getSuppliersBySkuId(skuId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier data', details: String(error) });
  }
});

router.post('/suppliers/by-skus', (req, res) => {
  const { sku_ids } = req.body;

  if (!sku_ids || !Array.isArray(sku_ids) || sku_ids.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid sku_ids array in request body' });
  }

  try {
    const data = getSuppliersBySkuIds(sku_ids);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier data', details: String(error) });
  }
});

router.get('/inventory/all', (req, res) => {
  try {
    const data = getAllInventory();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all inventory data', details: String(error) });
  }
});

router.get('/suppliers/all', (req, res) => {
  try {
    const data = getAllSuppliers();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all suppliers', details: String(error) });
  }
});

router.get('/events', (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required query params: from, to' });
  }

  try {
    const data = getEvents(from, to);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events data', details: String(error) });
  }
});

router.get('/staff/range', (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required query params: from, to' });
  }

  try {
    const data = getStaffDateRange(from, to);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff data', details: String(error) });
  }
});

// ============================================================================
// PATIENT ENDPOINTS
// ============================================================================

router.get('/patients', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const from = req.query.from as string;
  const to = req.query.to as string;

  try {
    const data = from && to 
      ? getPatientsByDateRange(from, to, page, limit)
      : getPatients(page, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients', details: String(error) });
  }
});

router.get('/patients/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }

  try {
    const data = getPatientById(id);
    if (!data) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient', details: String(error) });
  }
});

// ============================================================================
// ED HOURLY PAGINATED ENDPOINT
// ============================================================================

router.get('/ed/hourly/paginated', (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required query params: from, to' });
  }

  try {
    const data = getEDHourlyPaginated(from, to, page, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ED hourly data', details: String(error) });
  }
});

// ============================================================================
// PURCHASE WORKFLOW ENDPOINTS
// ============================================================================

router.get('/purchases/pending', (req, res) => {
  try {
    const data = getPendingPurchases();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending purchases', details: String(error) });
  }
});

router.get('/purchases/approved', (req, res) => {
  try {
    const data = getApprovedPurchases();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch approved purchases', details: String(error) });
  }
});

router.get('/inventory/for-ordering', (req, res) => {
  try {
    const data = getInventoryForOrdering();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory for ordering', details: String(error) });
  }
});

router.post('/purchases/create', (req, res) => {
  const { sku_id, quantity, supplier_id, reason, urgency } = req.body;

  if (!sku_id || !quantity || !supplier_id) {
    return res.status(400).json({ error: 'Missing required fields: sku_id, quantity, supplier_id' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  try {
    const id = createPendingPurchase({ sku_id, quantity, supplier_id, reason, urgency });
    res.status(201).json({ id, message: 'Pending purchase created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pending purchase', details: String(error) });
  }
});

router.post('/purchases/:id/approve', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid purchase ID' });
  }

  try {
    const purchaseId = approvePendingPurchase(id);
    if (purchaseId === null) {
      return res.status(404).json({ error: 'Pending purchase not found or already processed' });
    }
    res.json({ id: purchaseId, message: 'Purchase approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve purchase', details: String(error) });
  }
});

router.post('/purchases/:id/reject', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid purchase ID' });
  }

  try {
    const success = rejectPendingPurchase(id);
    if (!success) {
      return res.status(404).json({ error: 'Pending purchase not found or already processed' });
    }
    res.json({ message: 'Purchase rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject purchase', details: String(error) });
  }
});

// Get rejected purchases (history)
router.get('/purchases/rejected', (req, res) => {
  try {
    const data = getRejectedPurchases();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rejected purchases', details: String(error) });
  }
});

// Get supplier options for a SKU (for comparison)
router.get('/purchases/:id/supplier-options', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid purchase ID' });
  }

  try {
    // Get the SKU from the pending purchase
    const pendingPurchases = getPendingPurchases();
    const purchase = pendingPurchases.find(p => p.id === id);
    
    if (!purchase) {
      return res.status(404).json({ error: 'Pending purchase not found' });
    }

    const suppliers = getSupplierOptionsForSku(purchase.sku_id);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier options', details: String(error) });
  }
});

// Update supplier on a pending purchase
router.post('/purchases/:id/update-supplier', (req, res) => {
  const id = parseInt(req.params.id);
  const { supplier_id } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid purchase ID' });
  }

  if (!supplier_id) {
    return res.status(400).json({ error: 'Missing required field: supplier_id' });
  }

  try {
    const success = updatePendingPurchaseSupplier(id, supplier_id);
    if (!success) {
      return res.status(404).json({ error: 'Pending purchase not found or supplier not available' });
    }
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier', details: String(error) });
  }
});

export default router;
