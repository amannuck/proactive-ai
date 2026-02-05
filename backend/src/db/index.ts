import Database from 'better-sqlite3';
import { initializeDatabase } from './init';

export const db: Database.Database = initializeDatabase();

export default db;
