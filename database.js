const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_PATH = path.join(__dirname, 'studyspot.db');

let dbInstance = null;

/**
 * Returns the shared SQLite database connection.
 * Used by all route modules (carrels, students, bookings).
 *
 * Query interface supported:
 * - db.all(sql, [params]) -> returns array of rows
 * - db.get(sql, [params]) -> returns single row or undefined
 * - db.run(sql, [params]) -> returns { lastID, changes }
 */
const getDatabase = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    // Enable SQLite foreign key constraints
    await dbInstance.run('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
};

/**
 * ============================================================================
 * DATABASE INITIALIZATION & SCHEMA COORDINATION
 * ============================================================================
 *
 * Member 1 established this database connection interface.
 *
 * MEMBER 2 RESPONSIBILITIES:
 * 1. Implement table creation (CREATE TABLE IF NOT EXISTS) for all 3 tables:
 *    - students (id, name, email, ...)
 *    - carrels  (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, zone TEXT NOT NULL)
 *    - bookings (id, student_id, carrel_id, booking_date, start_time, end_time, ...)
 * 2. Configure foreign key relationships (bookings -> students, bookings -> carrels).
 * 3. Seed initial sample records for testing.
 *
 * Contract for carrels table (used by routes/carrels.js):
 * - Table name: "carrels"
 * - Columns:
 *     id   : INTEGER PRIMARY KEY AUTOINCREMENT
 *     name : TEXT NOT NULL
 *     zone : TEXT NOT NULL
 * ============================================================================
 */
const initializeDatabase = async () => {
  const db = await getDatabase();
  console.log(`[Database] SQLite connected at: ${DB_PATH}`);

  // Member 2: Add your table creation queries (CREATE TABLE IF NOT EXISTS) below:
  // e.g.:
  // await db.exec(`...`);

  return db;
};

module.exports = {
  getDatabase,
  initializeDatabase,
  DB_PATH,
};
