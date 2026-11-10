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
  try {
    if (!dbInstance) {
      dbInstance = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
      });
      // Enable SQLite foreign key constraint enforcement
      await dbInstance.run('PRAGMA foreign_keys = ON;');
    }
    return dbInstance;
  } catch (error) {
    console.error('[Database] Failed to open SQLite connection:', error.message);
    throw error;
  }
};

/**
 * Closes the active database connection if open.
 * Useful for clean test teardown and graceful server shutdown.
 */
const closeDatabase = async () => {
  try {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
    }
  } catch (error) {
    console.error('[Database] Error closing connection:', error.message);
    throw error;
  }
};

/**
 * ============================================================================
 * SQL TABLE CREATION STATEMENTS (Member 2 Deliverable)
 * ============================================================================
 */
const CREATE_STUDENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  );
`;

const CREATE_CARRELS_TABLE = `
  CREATE TABLE IF NOT EXISTS carrels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    zone TEXT NOT NULL
  );
`;

const CREATE_BOOKINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    carrel_id INTEGER NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (carrel_id) REFERENCES carrels(id) ON DELETE CASCADE
  );
`;

/**
 * SQL JOIN Query template for Member 3's bookings endpoint:
 * Retrieves complete booking information with student name, carrel name,
 * and carrel zone alongside booking details.
 */
const BOOKINGS_JOIN_QUERY = `
  SELECT 
    bookings.id,
    bookings.booking_date,
    bookings.booking_time,
    bookings.student_id,
    students.name AS student_name,
    students.email AS student_email,
    bookings.carrel_id,
    carrels.name AS carrel_name,
    carrels.zone AS carrel_zone
  FROM bookings
  JOIN students ON bookings.student_id = students.id
  JOIN carrels ON bookings.carrel_id = carrels.id
`;

/**
 * Seeds initial sample records only if the respective tables are empty.
 * Dynamically references existing student and carrel IDs to guarantee foreign key integrity.
 * Avoids duplicate records on subsequent server restarts.
 */
const seedSampleData = async (db) => {
  // 1. Seed students if empty
  const studentCount = await db.get('SELECT COUNT(*) AS count FROM students');
  if (studentCount.count === 0) {
    const sampleStudents = [
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
      { name: 'Diana Prince', email: 'diana@example.com' },
    ];
    for (const student of sampleStudents) {
      await db.run(
        'INSERT INTO students (name, email) VALUES (?, ?)',
        [student.name, student.email]
      );
    }
  }

  // 2. Seed carrels if empty
  const carrelCount = await db.get('SELECT COUNT(*) AS count FROM carrels');
  if (carrelCount.count === 0) {
    const sampleCarrels = [
      { name: 'Silent Pod A1', zone: 'Silent Study' },
      { name: 'Collab Table B3', zone: 'Collaborative' },
      { name: 'Window Desk C4', zone: 'Quiet Zone' },
      { name: 'Focus Booth D2', zone: 'Deep Focus' },
      { name: 'Group Hub E1', zone: 'Collaborative' },
    ];
    for (const carrel of sampleCarrels) {
      await db.run(
        'INSERT INTO carrels (name, zone) VALUES (?, ?)',
        [carrel.name, carrel.zone]
      );
    }
  }

  // 3. Seed bookings if empty AND valid parent records exist
  const bookingCount = await db.get('SELECT COUNT(*) AS count FROM bookings');
  if (bookingCount.count === 0) {
    const students = await db.all('SELECT id FROM students ORDER BY id ASC LIMIT 4');
    const carrels = await db.all('SELECT id FROM carrels ORDER BY id ASC LIMIT 3');

    if (students.length >= 2 && carrels.length >= 2) {
      const s1 = students[0].id;
      const s2 = students[1].id;
      const s3 = students[2] ? students[2].id : s1;
      const c1 = carrels[0].id;
      const c2 = carrels[1].id;
      const c3 = carrels[2] ? carrels[2].id : c1;

      const sampleBookings = [
        { student_id: s1, carrel_id: c1, booking_date: '2026-11-10', booking_time: '09:00 - 11:00' },
        { student_id: s2, carrel_id: c2, booking_date: '2026-11-10', booking_time: '11:00 - 13:00' },
        { student_id: s3, carrel_id: c3, booking_date: '2026-11-11', booking_time: '14:00 - 16:00' },
      ];

      for (const booking of sampleBookings) {
        await db.run(
          'INSERT INTO bookings (student_id, carrel_id, booking_date, booking_time) VALUES (?, ?, ?, ?)',
          [booking.student_id, booking.carrel_id, booking.booking_date, booking.booking_time]
        );
      }
    }
  }
};

/**
 * ============================================================================
 * DATABASE INITIALIZATION & SCHEMA COORDINATION
 * ============================================================================
 * Automatically called when Express starts (app.js -> startServer).
 * Creates students, carrels, and bookings tables if not present,
 * enables foreign keys, and seeds minimal sample data idempotently.
 */
const initializeDatabase = async () => {
  try {
    const db = await getDatabase();

    // Create tables in correct dependency order
    await db.exec(CREATE_STUDENTS_TABLE);
    await db.exec(CREATE_CARRELS_TABLE);
    await db.exec(CREATE_BOOKINGS_TABLE);

    // Seed sample data without duplicating
    await seedSampleData(db);

    console.log(`[Database] SQLite connected & schema initialized at: ${DB_PATH}`);
    return db;
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error.message);
    throw error;
  }
};

/**
 * ============================================================================
 * REUSABLE OPERATIONS: STUDENTS
 * ============================================================================
 */
const getAllStudents = async () => {
  const db = await getDatabase();
  return db.all('SELECT * FROM students ORDER BY id ASC');
};

const getStudentById = async (id) => {
  const db = await getDatabase();
  return db.get('SELECT * FROM students WHERE id = ?', [id]);
};

const insertStudent = async (studentOrName, maybeEmail) => {
  const db = await getDatabase();
  let name;
  let email = null;

  if (typeof studentOrName === 'object' && studentOrName !== null) {
    name = studentOrName.name;
    email = studentOrName.email !== undefined ? studentOrName.email : null;
  } else {
    name = studentOrName;
    email = maybeEmail !== undefined ? maybeEmail : null;
  }

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Student name is required and must be a non-empty string.');
  }

  const trimmedName = name.trim();
  const trimmedEmail = email && typeof email === 'string' ? email.trim() : null;

  let result;
  if (trimmedEmail) {
    result = await db.run(
      'INSERT INTO students (name, email) VALUES (?, ?)',
      [trimmedName, trimmedEmail]
    );
  } else {
    result = await db.run(
      'INSERT INTO students (name) VALUES (?)',
      [trimmedName]
    );
  }

  return {
    id: result.lastID,
    name: trimmedName,
    email: trimmedEmail,
  };
};

/**
 * ============================================================================
 * REUSABLE OPERATIONS: CARRELS
 * ============================================================================
 */
const getAllCarrels = async () => {
  const db = await getDatabase();
  return db.all('SELECT * FROM carrels ORDER BY id ASC');
};

const getCarrelById = async (id) => {
  const db = await getDatabase();
  return db.get('SELECT * FROM carrels WHERE id = ?', [id]);
};

const insertCarrel = async (carrelOrName, maybeZone) => {
  const db = await getDatabase();
  let id;
  let name;
  let zone;

  if (typeof carrelOrName === 'object' && carrelOrName !== null) {
    id = carrelOrName.id;
    name = carrelOrName.name;
    zone = carrelOrName.zone;
  } else {
    name = carrelOrName;
    zone = maybeZone;
  }

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Carrel name is required and must be a non-empty string.');
  }
  if (typeof zone !== 'string' || !zone.trim()) {
    throw new Error('Carrel zone is required and must be a non-empty string.');
  }

  const trimmedName = name.trim();
  const trimmedZone = zone.trim();

  let newId;
  if (id !== undefined && id !== null) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error('Invalid carrel ID. If provided, "id" must be a positive integer.');
    }
    await db.run(
      'INSERT INTO carrels (id, name, zone) VALUES (?, ?, ?)',
      [parsedId, trimmedName, trimmedZone]
    );
    newId = parsedId;
  } else {
    const result = await db.run(
      'INSERT INTO carrels (name, zone) VALUES (?, ?)',
      [trimmedName, trimmedZone]
    );
    newId = result.lastID;
  }

  return {
    id: newId,
    name: trimmedName,
    zone: trimmedZone,
  };
};

const updateCarrel = async (id, updateData) => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error('Invalid carrel ID. ID must be a positive integer.');
  }

  const { name, zone } = updateData || {};
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Carrel name is required and must be a non-empty string.');
  }
  if (typeof zone !== 'string' || !zone.trim()) {
    throw new Error('Carrel zone is required and must be a non-empty string.');
  }

  const db = await getDatabase();
  const existing = await db.get('SELECT * FROM carrels WHERE id = ?', [parsedId]);
  if (!existing) {
    return null;
  }

  const trimmedName = name.trim();
  const trimmedZone = zone.trim();

  await db.run(
    'UPDATE carrels SET name = ?, zone = ? WHERE id = ?',
    [trimmedName, trimmedZone, parsedId]
  );

  return {
    id: parsedId,
    name: trimmedName,
    zone: trimmedZone,
  };
};

const deleteCarrel = async (id) => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error('Invalid carrel ID. ID must be a positive integer.');
  }

  const db = await getDatabase();
  const existing = await db.get('SELECT * FROM carrels WHERE id = ?', [parsedId]);
  if (!existing) {
    return false;
  }

  await db.run('DELETE FROM carrels WHERE id = ?', [parsedId]);
  return true;
};

/**
 * ============================================================================
 * REUSABLE OPERATIONS: BOOKINGS
 * ============================================================================
 */
const getAllBookings = async () => {
  const db = await getDatabase();
  return db.all('SELECT * FROM bookings ORDER BY id ASC');
};

const getBookingById = async (id) => {
  const db = await getDatabase();
  return db.get('SELECT * FROM bookings WHERE id = ?', [id]);
};

const insertBooking = async (bookingData) => {
  const db = await getDatabase();
  const { student_id, carrel_id, booking_date, booking_time } = bookingData || {};

  const parsedStudentId = Number(student_id);
  if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
    throw new Error('Invalid student_id. It must be a positive integer.');
  }

  const parsedCarrelId = Number(carrel_id);
  if (!Number.isInteger(parsedCarrelId) || parsedCarrelId <= 0) {
    throw new Error('Invalid carrel_id. It must be a positive integer.');
  }

  if (typeof booking_date !== 'string' || !booking_date.trim()) {
    throw new Error('booking_date is required and must be a non-empty string.');
  }

  const trimmedDate = booking_date.trim();
  const trimmedTime = booking_time && typeof booking_time === 'string'
    ? booking_time.trim()
    : (booking_time || null);

  const result = await db.run(
    'INSERT INTO bookings (student_id, carrel_id, booking_date, booking_time) VALUES (?, ?, ?, ?)',
    [parsedStudentId, parsedCarrelId, trimmedDate, trimmedTime]
  );

  return {
    id: result.lastID,
    student_id: parsedStudentId,
    carrel_id: parsedCarrelId,
    booking_date: trimmedDate,
    booking_time: trimmedTime,
  };
};

const deleteBooking = async (id) => {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error('Invalid booking ID. ID must be a positive integer.');
  }

  const db = await getDatabase();
  const result = await db.run('DELETE FROM bookings WHERE id = ?', [parsedId]);
  return result.changes > 0;
};

/**
 * ============================================================================
 * REUSABLE OPERATIONS: BOOKINGS WITH DETAILS (JOIN QUERIES FOR MEMBER 3)
 * ============================================================================
 */
const getAllBookingsWithDetails = async () => {
  const db = await getDatabase();
  return db.all(`${BOOKINGS_JOIN_QUERY} ORDER BY bookings.id ASC`);
};

const getBookingWithDetailsById = async (id) => {
  const db = await getDatabase();
  return db.get(`${BOOKINGS_JOIN_QUERY} WHERE bookings.id = ?`, [id]);
};

const getBookingsByStudentId = async (studentId) => {
  const db = await getDatabase();
  return db.all(
    `${BOOKINGS_JOIN_QUERY} WHERE bookings.student_id = ? ORDER BY bookings.id ASC`,
    [studentId]
  );
};

const getBookingsByCarrelId = async (carrelId) => {
  const db = await getDatabase();
  return db.all(
    `${BOOKINGS_JOIN_QUERY} WHERE bookings.carrel_id = ? ORDER BY bookings.id ASC`,
    [carrelId]
  );
};

module.exports = {
  // Database instance & connection management
  getDatabase,
  initializeDatabase,
  closeDatabase,
  DB_PATH,

  // Table creation statements (for inspection or migrations)
  CREATE_STUDENTS_TABLE,
  CREATE_CARRELS_TABLE,
  CREATE_BOOKINGS_TABLE,

  // SQL JOIN Query string for Member 3
  BOOKINGS_JOIN_QUERY,

  // Student operations
  getAllStudents,
  getStudentById,
  insertStudent,
  createStudent: insertStudent,

  // Carrel operations
  getAllCarrels,
  getCarrelById,
  insertCarrel,
  createCarrel: insertCarrel,
  updateCarrel,
  deleteCarrel,

  // Booking operations
  getAllBookings,
  getBookingById,
  insertBooking,
  createBooking: insertBooking,
  deleteBooking,

  // JOIN query operations (for Member 3)
  getAllBookingsWithDetails,
  getBookingWithDetailsById,
  getBookingsByStudentId,
  getBookingsByCarrelId,
};
