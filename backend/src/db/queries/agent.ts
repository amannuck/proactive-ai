import { db } from '../index';

export interface AgentOutputRow {
  id: number;
  created_at: string;
  agent_name: string;
  output_type: string;
  window_start: string | null;
  window_end: string | null;
  payload_json: string;
}

// Create agent_outputs table if it doesn't exist
const createAgentOutputsTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS agent_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    agent_name TEXT NOT NULL,
    output_type TEXT NOT NULL,
    window_start TEXT,
    window_end TEXT,
    payload_json TEXT NOT NULL
  )
`);

createAgentOutputsTable.run();

const insertAgentOutput = db.prepare(`
  INSERT INTO agent_outputs (
    agent_name,
    output_type,
    window_start,
    window_end,
    payload_json
  ) VALUES (?, ?, ?, ?, ?)
`);

export function saveAgentOutput(
  agentName: string,
  outputType: string,
  windowStart: string | null,
  windowEnd: string | null,
  payload: unknown
): number {
  const result = insertAgentOutput.run(
    agentName,
    outputType,
    windowStart,
    windowEnd,
    JSON.stringify(payload)
  );
  return Number(result.lastInsertRowid);
}

const getAgentOutputs = db.prepare(`
  SELECT 
    id,
    created_at,
    agent_name,
    output_type,
    window_start,
    window_end,
    payload_json
  FROM agent_outputs
  ORDER BY created_at DESC
  LIMIT ?
`);

export function getRecentAgentOutputs(limit: number = 10): AgentOutputRow[] {
  return getAgentOutputs.all(limit) as AgentOutputRow[];
}
