import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(__dirname, '../../forecasting.db');
const migrationPath = path.join(__dirname, '../../database/migration.sql');
const seedDimensionsPath = path.join(__dirname, '../../database/seed_dimensions.sql');
const etlFactsPath = path.join(__dirname, '../../database/etl_facts.sql');
const csvDataPath = path.join(__dirname, '../../database/csv-data');

export function initializeDatabase(): Database.Database {
  const db = new Database(dbPath);
  
  // Enable foreign keys and WAL mode
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Check if tables exist
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='fact_ed_hourly'
  `).get();

  if (!tableCheck) {
    console.log('Database not initialized. Running migrations...');
    
    // Run migration
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      db.exec(migrationSql);
      console.log('✓ Migration applied');
    } else {
      console.error('Migration file not found:', migrationPath);
      return db;
    }

    // Load CSV data into raw tables
    loadCsvData(db);

    // Run seed dimensions
    if (fs.existsSync(seedDimensionsPath)) {
      const seedSql = fs.readFileSync(seedDimensionsPath, 'utf-8');
      db.exec(seedSql);
      console.log('✓ Dimensions seeded');
    }

    // Run ETL to populate fact tables
    if (fs.existsSync(etlFactsPath)) {
      const etlSql = fs.readFileSync(etlFactsPath, 'utf-8');
      db.exec(etlSql);
      console.log('✓ Fact tables populated');
    }

    console.log('Database initialization complete!');
  }

  // Always ensure purchases tables exist (added after initial migration)
  ensurePurchasesTables(db);

  // Seed purchase data if tables are empty
  seedPurchaseData(db);

  return db;
}

function ensurePurchasesTables(db: Database.Database) {
  // Check if pending_purchases table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='pending_purchases'
  `).get();

  if (!tableCheck) {
    console.log('Creating purchases tables...');
    
    db.exec(`
      -- Pending purchases table
      CREATE TABLE IF NOT EXISTS pending_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        supplier_id TEXT NOT NULL,
        unit_price REAL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reason TEXT,
        urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (sku_id) REFERENCES dim_item(sku_id),
        FOREIGN KEY (supplier_id) REFERENCES dim_supplier(supplier_id)
      );

      CREATE INDEX IF NOT EXISTS idx_pending_purchases_status ON pending_purchases(status);
      CREATE INDEX IF NOT EXISTS idx_pending_purchases_sku ON pending_purchases(sku_id);

      -- Approved purchases table
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        supplier_id TEXT NOT NULL,
        unit_price REAL,
        status TEXT DEFAULT 'approved',
        reason TEXT,
        approved_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (sku_id) REFERENCES dim_item(sku_id),
        FOREIGN KEY (supplier_id) REFERENCES dim_supplier(supplier_id)
      );

      CREATE INDEX IF NOT EXISTS idx_purchases_sku ON purchases(sku_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_approved_at ON purchases(approved_at);
    `);
    
    console.log('✓ Purchases tables created');
  }
}

function seedPurchaseData(db: Database.Database) {
  // Check if purchase data already exists
  const pendingCount = db.prepare('SELECT COUNT(*) as count FROM pending_purchases').get() as { count: number };
  const purchasesCount = db.prepare('SELECT COUNT(*) as count FROM purchases').get() as { count: number };

  if (pendingCount.count === 0 && purchasesCount.count === 0) {
    console.log('Seeding purchase data...');
    const seedPath = path.join(__dirname, '../../database/seed_purchases.sql');
    
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      db.exec(seedSql);
      
      const newPendingCount = db.prepare('SELECT COUNT(*) as count FROM pending_purchases').get() as { count: number };
      const newPurchasesCount = db.prepare('SELECT COUNT(*) as count FROM purchases').get() as { count: number };
      
      console.log(`✓ Seeded ${newPendingCount.count} pending purchases and ${newPurchasesCount.count} approved purchases`);
    } else {
      console.log('Purchase seed file not found, skipping...');
    }
  }
}

function loadCsvData(db: Database.Database) {
  const csvFiles = [
    { file: 'supplier_contracts.csv', table: 'raw_supplier_contract' },
    { file: 'staffing_schedule.csv', table: 'raw_staff_schedule' },
    { file: 'patient_data.csv', table: 'raw_patient_data' },
    { file: 'historical_events.csv', table: 'raw_historical_events' },
    { file: 'ed_hourly_snapshots.csv', table: 'raw_ed_hourly_snapshot' },
    { file: 'current_inventory.csv', table: 'raw_current_inventory' },
  ];

  for (const { file, table } of csvFiles) {
    const csvPath = path.join(csvDataPath, file);
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        console.log(`Skipping ${file}: no data rows`);
        continue;
      }

      // Parse header to get column count
      const header = parseCSVLine(lines[0]);
      const placeholders = header.map(() => '?').join(', ');
      const insertStmt = db.prepare(`INSERT INTO ${table} VALUES (${placeholders}, datetime('now'))`);

      const insertMany = db.transaction((rows: string[][]) => {
        for (const row of rows) {
          // Pad row to match header length if needed
          while (row.length < header.length) {
            row.push('');
          }
          insertStmt.run(...row.slice(0, header.length));
        }
      });

      // Parse data rows (skip header)
      const dataRows = lines.slice(1).map(line => parseCSVLine(line));
      insertMany(dataRows);
      
      console.log(`✓ Loaded ${dataRows.length} rows into ${table}`);
    } else {
      console.log(`CSV file not found: ${csvPath}`);
    }
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export default initializeDatabase;
