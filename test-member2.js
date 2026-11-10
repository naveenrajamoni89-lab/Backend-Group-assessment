/**
 * test-member2.js
 * Comprehensive automated verification suite for Member 2 deliverables:
 * 1. Database initialisation and table creation (students, carrels, bookings).
 * 2. SQLite foreign key enforcement (PRAGMA foreign_keys = ON).
 * 3. Table schema verification (columns, primary keys, foreign keys, NOT NULL).
 * 4. Constraint enforcement (foreign key violations, NOT NULL violations).
 * 5. Reusable database operations (students, carrels, bookings CRUD).
 * 6. SQL JOIN query verification (booking details with student and carrel names).
 * 7. Foreign key ON DELETE CASCADE behavior.
 * 8. Idempotent initialization (no duplicates or data loss on restart).
 * 9. End-to-end compatibility with Member 1's Carrels Express REST API.
 */

const http = require('http');
const {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  getAllStudents,
  getStudentById,
  insertStudent,
  getAllCarrels,
  getCarrelById,
  insertCarrel,
  updateCarrel,
  deleteCarrel,
  getAllBookings,
  getBookingById,
  insertBooking,
  getAllBookingsWithDetails,
  getBookingWithDetailsById,
  BOOKINGS_JOIN_QUERY,
} = require('./database');
const { app } = require('./app');

const runMember2Tests = async () => {
  console.log('====================================================');
  console.log(' StudySpot Cafe - Member 2 Verification Suite');
  console.log(' SQLite Database & Schema Implementation');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, testName, details = '') => {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`    Details: ${details}`);
    }
  };

  try {
    // ------------------------------------------------------------------------
    // Group 1: Database Initialisation & Schema Verification
    // ------------------------------------------------------------------------
    console.log('--- Group 1: Database Initialisation & Schema Verification ---');

    const db = await initializeDatabase();
    assert(!!db, 'initializeDatabase() returns an active database connection');

    // 1. Verify foreign key pragma is ON
    const fkStatus = await db.get('PRAGMA foreign_keys;');
    assert(fkStatus.foreign_keys === 1, 'SQLite foreign keys enabled (PRAGMA foreign_keys = 1)');

    // 2. Verify all three tables exist in sqlite_master
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('students', 'carrels', 'bookings') ORDER BY name ASC;"
    );
    const tableNames = tables.map((t) => t.name);
    assert(tableNames.includes('students'), 'Table "students" exists');
    assert(tableNames.includes('carrels'), 'Table "carrels" exists');
    assert(tableNames.includes('bookings'), 'Table "bookings" exists');

    // 3. Verify students table columns
    const studentsColumns = await db.all("PRAGMA table_info('students');");
    const studentColNames = studentsColumns.map((c) => c.name);
    assert(studentColNames.includes('id'), 'students table contains "id"');
    assert(studentColNames.includes('name'), 'students table contains "name"');
    const studentIdCol = studentsColumns.find((c) => c.name === 'id');
    const studentNameCol = studentsColumns.find((c) => c.name === 'name');
    assert(studentIdCol && studentIdCol.pk === 1, 'students.id is Primary Key');
    assert(studentNameCol && studentNameCol.notnull === 1, 'students.name is NOT NULL');

    // 4. Verify carrels table columns
    const carrelsColumns = await db.all("PRAGMA table_info('carrels');");
    const carrelColNames = carrelsColumns.map((c) => c.name);
    assert(carrelColNames.includes('id'), 'carrels table contains "id"');
    assert(carrelColNames.includes('name'), 'carrels table contains "name"');
    assert(carrelColNames.includes('zone'), 'carrels table contains "zone"');
    const carrelIdCol = carrelsColumns.find((c) => c.name === 'id');
    const carrelNameCol = carrelsColumns.find((c) => c.name === 'name');
    const carrelZoneCol = carrelsColumns.find((c) => c.name === 'zone');
    assert(carrelIdCol && carrelIdCol.pk === 1, 'carrels.id is Primary Key');
    assert(carrelNameCol && carrelNameCol.notnull === 1, 'carrels.name is NOT NULL');
    assert(carrelZoneCol && carrelZoneCol.notnull === 1, 'carrels.zone is NOT NULL');

    // 5. Verify bookings table columns
    const bookingsColumns = await db.all("PRAGMA table_info('bookings');");
    const bookingColNames = bookingsColumns.map((c) => c.name);
    assert(bookingColNames.includes('id'), 'bookings table contains "id"');
    assert(bookingColNames.includes('student_id'), 'bookings table contains "student_id"');
    assert(bookingColNames.includes('carrel_id'), 'bookings table contains "carrel_id"');
    assert(bookingColNames.includes('booking_date'), 'bookings table contains "booking_date"');
    assert(bookingColNames.includes('booking_time'), 'bookings table contains "booking_time"');
    const bookingIdCol = bookingsColumns.find((c) => c.name === 'id');
    const bookingStudentIdCol = bookingsColumns.find((c) => c.name === 'student_id');
    const bookingCarrelIdCol = bookingsColumns.find((c) => c.name === 'carrel_id');
    const bookingDateCol = bookingsColumns.find((c) => c.name === 'booking_date');
    assert(bookingIdCol && bookingIdCol.pk === 1, 'bookings.id is Primary Key');
    assert(bookingStudentIdCol && bookingStudentIdCol.notnull === 1, 'bookings.student_id is NOT NULL');
    assert(bookingCarrelIdCol && bookingCarrelIdCol.notnull === 1, 'bookings.carrel_id is NOT NULL');
    assert(bookingDateCol && bookingDateCol.notnull === 1, 'bookings.booking_date is NOT NULL');

    // 6. Verify foreign key metadata on bookings
    const bookingsFkList = await db.all("PRAGMA foreign_key_list('bookings');");
    const fkStudents = bookingsFkList.find(
      (fk) => fk.table === 'students' && fk.from === 'student_id' && fk.to === 'id'
    );
    const fkCarrels = bookingsFkList.find(
      (fk) => fk.table === 'carrels' && fk.from === 'carrel_id' && fk.to === 'id'
    );
    assert(!!fkStudents, 'bookings references students(id) foreign key');
    assert(!!fkCarrels, 'bookings references carrels(id) foreign key');

    // ------------------------------------------------------------------------
    // Group 2: Constraint Enforcement & Foreign Key Protection
    // ------------------------------------------------------------------------
    console.log('\n--- Group 2: Constraint Enforcement & Foreign Key Validation ---');

    // 1. Foreign key constraint rejection on non-existent student_id
    let fkStudentError = null;
    try {
      await db.run(
        'INSERT INTO bookings (student_id, carrel_id, booking_date) VALUES (?, ?, ?)',
        [999999, 1, '2026-11-20']
      );
    } catch (err) {
      fkStudentError = err;
    }
    assert(
      fkStudentError !== null && fkStudentError.message.includes('FOREIGN KEY constraint failed'),
      'Rejects booking with non-existent student_id (FOREIGN KEY constraint failed)'
    );

    // 2. Foreign key constraint rejection on non-existent carrel_id
    let fkCarrelError = null;
    try {
      await db.run(
        'INSERT INTO bookings (student_id, carrel_id, booking_date) VALUES (?, ?, ?)',
        [1, 999999, '2026-11-20']
      );
    } catch (err) {
      fkCarrelError = err;
    }
    assert(
      fkCarrelError !== null && fkCarrelError.message.includes('FOREIGN KEY constraint failed'),
      'Rejects booking with non-existent carrel_id (FOREIGN KEY constraint failed)'
    );

    // 3. NOT NULL constraint on student name
    let nullStudentError = null;
    try {
      await db.run('INSERT INTO students (name) VALUES (NULL);');
    } catch (err) {
      nullStudentError = err;
    }
    assert(
      nullStudentError !== null && nullStudentError.message.includes('NOT NULL constraint failed'),
      'Rejects student without name (NOT NULL constraint failed)'
    );

    // 4. NOT NULL constraint on carrel name
    let nullCarrelNameError = null;
    try {
      await db.run('INSERT INTO carrels (name, zone) VALUES (NULL, "Zone A");');
    } catch (err) {
      nullCarrelNameError = err;
    }
    assert(
      nullCarrelNameError !== null && nullCarrelNameError.message.includes('NOT NULL constraint failed'),
      'Rejects carrel without name (NOT NULL constraint failed)'
    );

    // 5. NOT NULL constraint on carrel zone
    let nullCarrelZoneError = null;
    try {
      await db.run('INSERT INTO carrels (name, zone) VALUES ("Carrel X", NULL);');
    } catch (err) {
      nullCarrelZoneError = err;
    }
    assert(
      nullCarrelZoneError !== null && nullCarrelZoneError.message.includes('NOT NULL constraint failed'),
      'Rejects carrel without zone (NOT NULL constraint failed)'
    );

    // ------------------------------------------------------------------------
    // Group 3: Reusable Operations – Students
    // ------------------------------------------------------------------------
    console.log('\n--- Group 3: Reusable Operations – Students ---');

    const createdStudent = await insertStudent({
      name: 'Test Student Omega',
      email: 'omega@example.com',
    });
    assert(
      createdStudent && createdStudent.id > 0 && createdStudent.name === 'Test Student Omega',
      'insertStudent() inserts and returns new student record'
    );

    const fetchedStudent = await getStudentById(createdStudent.id);
    assert(
      fetchedStudent && fetchedStudent.name === 'Test Student Omega',
      'getStudentById() retrieves the correct student'
    );

    const allStudents = await getAllStudents();
    assert(
      Array.isArray(allStudents) && allStudents.length >= 1,
      'getAllStudents() returns non-empty array of students'
    );

    // ------------------------------------------------------------------------
    // Group 4: Reusable Operations – Carrels
    // ------------------------------------------------------------------------
    console.log('\n--- Group 4: Reusable Operations – Carrels ---');

    const createdCarrel = await insertCarrel({
      name: 'Omega Pod 99',
      zone: 'Deep Silence',
    });
    assert(
      createdCarrel && createdCarrel.id > 0 && createdCarrel.name === 'Omega Pod 99',
      'insertCarrel() inserts and returns new carrel record'
    );

    const fetchedCarrel = await getCarrelById(createdCarrel.id);
    assert(
      fetchedCarrel && fetchedCarrel.zone === 'Deep Silence',
      'getCarrelById() retrieves the correct carrel'
    );

    const updatedCarrel = await updateCarrel(createdCarrel.id, {
      name: 'Omega Pod 99 - Renovated',
      zone: 'Premium Silence',
    });
    assert(
      updatedCarrel &&
        updatedCarrel.name === 'Omega Pod 99 - Renovated' &&
        updatedCarrel.zone === 'Premium Silence',
      'updateCarrel() updates and returns modified carrel'
    );

    const allCarrels = await getAllCarrels();
    assert(
      Array.isArray(allCarrels) && allCarrels.length >= 1,
      'getAllCarrels() returns array of carrels'
    );

    // ------------------------------------------------------------------------
    // Group 5: Reusable Operations – Bookings & Relationships
    // ------------------------------------------------------------------------
    console.log('\n--- Group 5: Reusable Operations – Bookings & Relationships ---');

    const createdBooking = await insertBooking({
      student_id: createdStudent.id,
      carrel_id: createdCarrel.id,
      booking_date: '2026-11-25',
      booking_time: '14:00 - 16:00',
    });
    assert(
      createdBooking &&
        createdBooking.id > 0 &&
        createdBooking.student_id === createdStudent.id &&
        createdBooking.carrel_id === createdCarrel.id,
      'insertBooking() creates booking referencing existing student and carrel'
    );

    // One student can have multiple bookings
    const secondBooking = await insertBooking({
      student_id: createdStudent.id,
      carrel_id: createdCarrel.id,
      booking_date: '2026-11-26',
      booking_time: '10:00 - 12:00',
    });
    assert(
      secondBooking && secondBooking.id !== createdBooking.id,
      'One student can have multiple bookings'
    );

    const fetchedBooking = await getBookingById(createdBooking.id);
    assert(
      fetchedBooking && fetchedBooking.booking_date === '2026-11-25',
      'getBookingById() retrieves booking by ID'
    );

    const allBookings = await getAllBookings();
    assert(
      Array.isArray(allBookings) && allBookings.length >= 2,
      'getAllBookings() returns array of bookings'
    );

    // ------------------------------------------------------------------------
    // Group 6: SQL JOIN Query Verification (for Member 3)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 6: SQL JOIN Query Verification (for Member 3) ---');

    assert(typeof BOOKINGS_JOIN_QUERY === 'string' && BOOKINGS_JOIN_QUERY.includes('JOIN students'), 'BOOKINGS_JOIN_QUERY is exported and contains JOIN students');
    assert(BOOKINGS_JOIN_QUERY.includes('JOIN carrels'), 'BOOKINGS_JOIN_QUERY contains JOIN carrels');

    const detailedBookings = await getAllBookingsWithDetails();
    assert(
      Array.isArray(detailedBookings) && detailedBookings.length > 0,
      'getAllBookingsWithDetails() returns joined booking records'
    );

    const specificJoined = await getBookingWithDetailsById(createdBooking.id);
    assert(
      specificJoined &&
        specificJoined.id === createdBooking.id &&
        specificJoined.student_name === 'Test Student Omega' &&
        specificJoined.carrel_name === 'Omega Pod 99 - Renovated' &&
        specificJoined.carrel_zone === 'Premium Silence' &&
        specificJoined.booking_date === '2026-11-25' &&
        specificJoined.booking_time === '14:00 - 16:00',
      'Joined booking details include student name, carrel name, and carrel zone'
    );

    // ------------------------------------------------------------------------
    // Group 7: Foreign Key Cascade Behavior
    // ------------------------------------------------------------------------
    console.log('\n--- Group 7: Foreign Key Cascade Behavior ---');

    // Deleting carrel cascades to bookings
    const carrelDeleted = await deleteCarrel(createdCarrel.id);
    assert(carrelDeleted === true, 'deleteCarrel() removes carrel record');

    const bookingAfterCarrelDelete = await getBookingById(createdBooking.id);
    assert(
      bookingAfterCarrelDelete === undefined,
      'Associated booking is cascade deleted when parent carrel is deleted'
    );

    const secondBookingAfterCarrelDelete = await getBookingById(secondBooking.id);
    assert(
      secondBookingAfterCarrelDelete === undefined,
      'All bookings referencing deleted carrel are cascade deleted'
    );

    // Clean up temporary test student
    await db.run('DELETE FROM students WHERE id = ?', [createdStudent.id]);

    // ------------------------------------------------------------------------
    // Group 8: Idempotency & Server Restart Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Group 8: Idempotency & Server Restart Verification ---');

    const studentsBeforeRestart = await getAllStudents();
    const carrelsBeforeRestart = await getAllCarrels();
    const bookingsBeforeRestart = await getAllBookings();

    // Call initializeDatabase again (simulates server restart)
    await initializeDatabase();

    const studentsAfterRestart = await getAllStudents();
    const carrelsAfterRestart = await getAllCarrels();
    const bookingsAfterRestart = await getAllBookings();

    assert(
      studentsBeforeRestart.length === studentsAfterRestart.length,
      'initializeDatabase() preserves existing students on restart (no duplicates)'
    );
    assert(
      carrelsBeforeRestart.length === carrelsAfterRestart.length,
      'initializeDatabase() preserves existing carrels on restart (no duplicates)'
    );
    assert(
      bookingsBeforeRestart.length === bookingsAfterRestart.length,
      'initializeDatabase() preserves existing bookings on restart (no duplicates)'
    );

    // ------------------------------------------------------------------------
    // Group 9: Express Carrels REST API Compatibility (Member 1)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 9: Express Carrels REST API End-to-End Compatibility ---');

    const testServer = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = testServer.address().port;
    const baseUrl = `http://localhost:${port}`;

    const request = (path, options = {}, body = null) => {
      return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const reqOptions = {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        };

        const req = http.request(url, reqOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = data;
            }
            resolve({ status: res.statusCode, body: parsed });
          });
        });

        req.on('error', reject);
        if (body) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
      });
    };

    try {
      // 1. GET /carrels
      const getCarrelsRes = await request('/carrels');
      assert(getCarrelsRes.status === 200, 'GET /carrels returns 200 OK');
      assert(Array.isArray(getCarrelsRes.body), 'GET /carrels returns an array of carrels');

      // 2. POST /carrels
      const postCarrelRes = await request('/carrels', { method: 'POST' }, {
        name: 'Member2 Integration Desk',
        zone: 'Integration Zone',
      });
      assert(postCarrelRes.status === 201, 'POST /carrels returns 201 Created');
      const newCarrelId = postCarrelRes.body.carrel.id;

      // 3. GET /carrels/:id
      const getSingleCarrelRes = await request(`/carrels/${newCarrelId}`);
      assert(getSingleCarrelRes.status === 200, `GET /carrels/${newCarrelId} returns 200 OK`);
      assert(
        getSingleCarrelRes.body.name === 'Member2 Integration Desk',
        'Retrieved carrel has matching name'
      );

      // 4. PUT /carrels/:id
      const putCarrelRes = await request(`/carrels/${newCarrelId}`, { method: 'PUT' }, {
        name: 'Member2 Integration Desk (Updated)',
        zone: 'Silent Focus',
      });
      assert(putCarrelRes.status === 200, 'PUT /carrels/:id returns 200 OK');
      assert(
        putCarrelRes.body.carrel.name === 'Member2 Integration Desk (Updated)',
        'PUT /carrels/:id successfully updates name'
      );

      // 5. DELETE /carrels/:id
      const deleteCarrelRes = await request(`/carrels/${newCarrelId}`, { method: 'DELETE' });
      assert(deleteCarrelRes.status === 200, 'DELETE /carrels/:id returns 200 OK');

      // 6. Verify 404 after delete
      const verifyDeleteRes = await request(`/carrels/${newCarrelId}`);
      assert(verifyDeleteRes.status === 404, 'GET /carrels/:id returns 404 after deletion');
    } finally {
      testServer.close();
    }
  } catch (error) {
    console.error('Fatal error during Member 2 test execution:', error);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log(` Results: ${passed} / ${total} tests passed.`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runMember2Tests().catch((err) => {
  console.error('Fatal Member 2 test suite failure:', err);
  process.exit(1);
});

