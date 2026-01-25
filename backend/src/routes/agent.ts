import { Router } from 'express';
import { getEDHourly } from '../db/queries/ed';
import { getStaffDay } from '../db/queries/staff';
import { getInventoryRiskByDays } from '../db/queries/inventory';
import { getEvents } from '../db/queries/events';
import { saveAgentOutput } from '../db/queries/agent';

const router = Router();

router.get('/context', (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  const date = req.query.date as string;

  if (!from || !to || !date) {
    return res.status(400).json({ error: 'Missing required query params: from, to, date' });
  }

  try {
    const edHourly = getEDHourly(from, to);
    const staffDay = getStaffDay(date);
    const inventoryRisk7d = getInventoryRiskByDays(7);
    const events = getEvents(from, to);

    res.json({
      ed_hourly: edHourly,
      staff_day: staffDay,
      inventory_risk_7d: inventoryRisk7d,
      events: events,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch context data', details: String(error) });
  }
});

router.post('/outputs', (req, res) => {
  const { agent_name, output_type, window_start, window_end, payload } = req.body;

  if (!agent_name || !output_type || !payload) {
    return res.status(400).json({ 
      error: 'Missing required fields: agent_name, output_type, payload' 
    });
  }

  try {
    const id = saveAgentOutput(
      agent_name,
      output_type,
      window_start || null,
      window_end || null,
      payload
    );

    res.status(201).json({ 
      id,
      message: 'Agent output saved successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save agent output', details: String(error) });
  }
});

export default router;
