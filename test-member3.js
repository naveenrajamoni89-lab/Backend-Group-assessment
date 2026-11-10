/**
 * test-member3.js
 * Comprehensive automated verification suite for Member 3 deliverables:
 * 1. Booking REST APIs (GET all, GET one, POST, DELETE, validation, 404 handling).
 * 2. Foreign key rejection (non-existent student_id and carrel_id).
 * 3. Booking JOIN endpoints (GET /bookings/details and GET /bookings/details/:id).
 * 4. Joined details verification (student_name, carrel_name, carrel_zone, booking info).
 * 5. Carrels search query parameter (GET /carrels?zone=...).
 * 6. Carrels body & input validation.
 * 7. Student REST APIs (GET /students, GET /students/:id, POST /students).
 */

const http = require('http');
const { app } = require('./app');
const {
  getDatabase,
  initializeDatabase,
  getAllStudents,
  getAllCarrels,
  getAllBookings,
  insertStudent,
  insertCarrel,
  insertBooking,
} = require('./database');

const runMember3Tests = async () => {
  console.log('====================================================');
  console.log(' StudySpot Cafe - Member 3 Verification Suite');
  console.log(' Bookings APIs, JOIN Endpoints, Validation & Search');
  console.log('====================================================\n');

  // Start server on an ephemeral free port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[Test Server] Running at ${baseUrl}\n`);

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
      if (body !== null) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  };

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
    // Ensure database is initialized
    await initializeDatabase();
    let students = await getAllStudents();
    let carrels = await getAllCarrels();

    // Ensure we have at least 2 students
    if (students.length < 2) {
      await insertStudent({ name: 'Rahul Sharma', email: 'rahul@example.com' });
      await insertStudent({ name: 'Priya Patel', email: 'priya@example.com' });
      students = await getAllStudents();
    }

    // Ensure we have at least 2 carrels and a "Silent Study" carrel for search tests
    if (carrels.length < 2 || !carrels.some((c) => c.zone === 'Silent Study')) {
      await insertCarrel({ name: 'Silent Pod A1', zone: 'Silent Study' });
      await insertCarrel({ name: 'Collab Table B3', zone: 'Collaborative' });
      carrels = await getAllCarrels();
    }

    // Ensure at least one initial booking exists
    let existingBookings = await getAllBookings();
    if (existingBookings.length === 0) {
      await insertBooking({
        student_id: students[0].id,
        carrel_id: carrels[0].id,
        booking_date: '2026-11-10',
        booking_time: '09:00 - 11:00',
      });
    }

    const validStudentId = students[0].id;
    const validCarrelId = carrels[0].id;

    // ------------------------------------------------------------------------
    // Group 1: Booking REST APIs
    // ------------------------------------------------------------------------
    console.log('--- Group 1: Booking REST APIs ---');

    // 1. GET all bookings
    const getAllBookingsRes = await request('/bookings');
    assert(getAllBookingsRes.status === 200, 'GET /bookings returns 200 OK');
    assert(Array.isArray(getAllBookingsRes.body), 'GET /bookings returns an array of bookings');
    assert(getAllBookingsRes.body.length > 0, 'GET /bookings contains seeded bookings');

    const firstBookingId = getAllBookingsRes.body[0].id;

    // 2. GET one booking
    const getOneBookingRes = await request(`/bookings/${firstBookingId}`);
    assert(getOneBookingRes.status === 200, `GET /bookings/${firstBookingId} returns 200 OK`);
    assert(getOneBookingRes.body.id === firstBookingId, 'Retrieved booking matches requested ID');
    assert(!!getOneBookingRes.body.student_id, 'Retrieved booking contains student_id');
    assert(!!getOneBookingRes.body.carrel_id, 'Retrieved booking contains carrel_id');
    assert(!!getOneBookingRes.body.booking_date, 'Retrieved booking contains booking_date');

    // 3. GET booking with invalid ID
    const invalidIdRes = await request('/bookings/invalid-id');
    assert(invalidIdRes.status === 400, 'GET /bookings/invalid-id returns 400 Bad Request');

    const negativeIdRes = await request('/bookings/-10');
    assert(negativeIdRes.status === 400, 'GET /bookings/-10 returns 400 Bad Request');

    // 4. GET booking with non-existent ID (404)
    const notFoundBookingRes = await request('/bookings/999999');
    assert(notFoundBookingRes.status === 404, 'GET /bookings/999999 returns 404 Not Found');

    // 5. POST a valid booking
    const newBookingPayload = {
      student_id: validStudentId,
      carrel_id: validCarrelId,
      booking_date: '2026-11-20',
      booking_time: '10:00 - 12:00',
    };
    const createBookingRes = await request('/bookings', { method: 'POST' }, newBookingPayload);
    assert(createBookingRes.status === 201, 'POST /bookings returns 201 Created');
    const createdBooking = createBookingRes.body.booking || createBookingRes.body;
    assert(createdBooking && createdBooking.id > 0, 'POST /bookings returns created booking with ID');
    assert(createdBooking.student_id === validStudentId, 'Created booking has correct student_id');
    assert(createdBooking.carrel_id === validCarrelId, 'Created booking has correct carrel_id');
    assert(createdBooking.booking_date === '2026-11-20', 'Created booking has correct booking_date');
    assert(createdBooking.booking_time === '10:00 - 12:00', 'Created booking has correct booking_time');

    const createdBookingId = createdBooking.id;

    // 6. Reject invalid booking data (missing or invalid fields)
    const missingStudentRes = await request('/bookings', { method: 'POST' }, {
      carrel_id: validCarrelId,
      booking_date: '2026-11-20',
    });
    assert(missingStudentRes.status === 400, 'Reject booking without student_id (400 Bad Request)');

    const invalidStudentTypeRes = await request('/bookings', { method: 'POST' }, {
      student_id: 'abc',
      carrel_id: validCarrelId,
      booking_date: '2026-11-20',
    });
    assert(invalidStudentTypeRes.status === 400, 'Reject booking with non-numeric student_id (400 Bad Request)');

    const missingCarrelRes = await request('/bookings', { method: 'POST' }, {
      student_id: validStudentId,
      booking_date: '2026-11-20',
    });
    assert(missingCarrelRes.status === 400, 'Reject booking without carrel_id (400 Bad Request)');

    const invalidCarrelTypeRes = await request('/bookings', { method: 'POST' }, {
      student_id: validStudentId,
      carrel_id: -5,
      booking_date: '2026-11-20',
    });
    assert(invalidCarrelTypeRes.status === 400, 'Reject booking with negative carrel_id (400 Bad Request)');

    const missingDateRes = await request('/bookings', { method: 'POST' }, {
      student_id: validStudentId,
      carrel_id: validCarrelId,
    });
    assert(missingDateRes.status === 400, 'Reject booking without booking_date (400 Bad Request)');

    const emptyDateRes = await request('/bookings', { method: 'POST' }, {
      student_id: validStudentId,
      carrel_id: validCarrelId,
      booking_date: '   ',
    });
    assert(emptyDateRes.status === 400, 'Reject booking with whitespace-only booking_date (400 Bad Request)');

    const invalidDateFormatRes = await request('/bookings', { method: 'POST' }, {
      student_id: validStudentId,
      carrel_id: validCarrelId,
      booking_date: '20-11-2026',
    });
    assert(invalidDateFormatRes.status === 400, 'Reject booking with invalid date format (400 Bad Request)');

    // 7. Reject non-existent student IDs
    const nonExistentStudentRes = await request('/bookings', { method: 'POST' }, {
      student_id: 999999,
      carrel_id: validCarrelId,
      booking_date: '2026-11-20',
    });
    assert(nonExistentStudentRes.status === 400, 'Reject non-existent student IDs (400 Bad Request)');
    assert(
      typeof nonExistentStudentRes.body.error === 'string' &&
        /student/i.test(nonExistentStudentRes.body.error),
      'Error message identifies non-existent student'
    );

    // 8. Reject non-existent carrel IDs
    const nonExistentCarrelRes = await request('/bookings', { method: 'POST' }, {
      student_id: validStudentId,
      carrel_id: 999999,
      booking_date: '2026-11-20',
    });
    assert(nonExistentCarrelRes.status === 400, 'Reject non-existent carrel IDs (400 Bad Request)');
    assert(
      typeof nonExistentCarrelRes.body.error === 'string' &&
        /carrel/i.test(nonExistentCarrelRes.body.error),
      'Error message identifies non-existent carrel'
    );

    // 9. DELETE an existing booking
    const deleteBookingRes = await request(`/bookings/${createdBookingId}`, { method: 'DELETE' });
    assert(deleteBookingRes.status === 200, `DELETE /bookings/${createdBookingId} returns 200 OK`);

    // Verify deleted
    const verifyDeletedRes = await request(`/bookings/${createdBookingId}`);
    assert(verifyDeletedRes.status === 404, 'GET deleted booking returns 404 Not Found');

    // 10. Return 404 for missing booking deletion
    const deleteNotFoundRes = await request('/bookings/999999', { method: 'DELETE' });
    assert(deleteNotFoundRes.status === 404, 'DELETE /bookings/999999 returns 404 Not Found');

    const deleteInvalidIdRes = await request('/bookings/abc', { method: 'DELETE' });
    assert(deleteInvalidIdRes.status === 400, 'DELETE /bookings/abc returns 400 Bad Request');

    // ------------------------------------------------------------------------
    // Group 2: Booking JOIN Endpoints (/bookings/details)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 2: Booking JOIN Endpoints ---');

    // 1. GET /bookings/details
    const detailsRes = await request('/bookings/details');
    assert(detailsRes.status === 200, 'GET /bookings/details returns 200 OK');
    assert(Array.isArray(detailsRes.body) && detailsRes.body.length > 0, 'GET /bookings/details returns array of joined records');

    const sampleDetail = detailsRes.body[0];
    assert(typeof sampleDetail.id === 'number', 'Booking detail contains "id"');
    assert(typeof sampleDetail.student_name === 'string' && sampleDetail.student_name.length > 0, 'Verify student names are returned');
    assert(typeof sampleDetail.carrel_name === 'string' && sampleDetail.carrel_name.length > 0, 'Verify carrel names are returned');
    assert(typeof sampleDetail.carrel_zone === 'string' && sampleDetail.carrel_zone.length > 0, 'Booking detail contains "carrel_zone"');
    assert(typeof sampleDetail.booking_date === 'string' && sampleDetail.booking_date.length > 0, 'Verify booking date is correct');

    // 2. GET /bookings/details/:id
    const singleDetailRes = await request(`/bookings/details/${sampleDetail.id}`);
    assert(singleDetailRes.status === 200, `GET /bookings/details/${sampleDetail.id} returns 200 OK`);
    assert(singleDetailRes.body.id === sampleDetail.id, 'Single detail matches requested booking ID');
    assert(singleDetailRes.body.student_name === sampleDetail.student_name, 'Single detail returns correct student_name');
    assert(singleDetailRes.body.carrel_name === sampleDetail.carrel_name, 'Single detail returns correct carrel_name');

    // 3. GET /bookings/details/:id error handling
    const detailsInvalidIdRes = await request('/bookings/details/xyz');
    assert(detailsInvalidIdRes.status === 400, 'GET /bookings/details/xyz returns 400 Bad Request');

    const detailsNotFoundRes = await request('/bookings/details/999999');
    assert(detailsNotFoundRes.status === 404, 'GET /bookings/details/999999 returns 404 Not Found');

    // 4. GET /bookings/details with query filters
    const filterByStudentRes = await request(`/bookings/details?student_id=${sampleDetail.student_id}`);
    assert(filterByStudentRes.status === 200, 'GET /bookings/details?student_id=X returns 200 OK');
    assert(
      filterByStudentRes.body.every((b) => b.student_id === sampleDetail.student_id),
      'All filtered records match requested student_id'
    );

    const filterByCarrelRes = await request(`/bookings/details?carrel_id=${sampleDetail.carrel_id}`);
    assert(filterByCarrelRes.status === 200, 'GET /bookings/details?carrel_id=X returns 200 OK');
    assert(
      filterByCarrelRes.body.every((b) => b.carrel_id === sampleDetail.carrel_id),
      'All filtered records match requested carrel_id'
    );

    // ------------------------------------------------------------------------
    // Group 3: Carrels Validation & Search Filter
    // ------------------------------------------------------------------------
    console.log('\n--- Group 3: Carrels Validation & Search Filter ---');

    // 1. Search by zone: GET /carrels?zone=Silent%20Study
    const zoneSearchRes = await request('/carrels?zone=Silent%20Study');
    assert(zoneSearchRes.status === 200, 'GET /carrels?zone=Silent%20Study returns 200 OK');
    assert(Array.isArray(zoneSearchRes.body), 'Search result is an array');
    assert(
      zoneSearchRes.body.length > 0 && zoneSearchRes.body.every((c) => c.zone === 'Silent Study'),
      'Search returns only carrels belonging to "Silent Study" zone'
    );

    // 2. Search by non-existent zone returns empty array
    const emptyZoneRes = await request('/carrels?zone=NonExistentZone123');
    assert(emptyZoneRes.status === 200, 'GET /carrels?zone=NonExistentZone123 returns 200 OK');
    assert(Array.isArray(emptyZoneRes.body) && emptyZoneRes.body.length === 0, 'Returns empty array when no carrels match zone');

    // 3. Search with invalid zone query parameter
    const invalidZoneRes = await request('/carrels?zone=   ');
    assert(invalidZoneRes.status === 400, 'GET /carrels?zone=   returns 400 Bad Request');

    // 4. POST /carrels invalid request body validation
    const emptyBodyCarrelRes = await request('/carrels', { method: 'POST' }, {});
    assert(emptyBodyCarrelRes.status === 400, 'POST /carrels with empty body returns 400');

    // 5. PUT /carrels/:id invalid request body validation
    const emptyBodyPutRes = await request(`/carrels/${validCarrelId}`, { method: 'PUT' }, {});
    assert(emptyBodyPutRes.status === 400, 'PUT /carrels/:id with empty body returns 400');

    // ------------------------------------------------------------------------
    // Group 4: Student REST Endpoints (/students)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 4: Student REST Endpoints ---');

    // 1. GET /students
    const getStudentsRes = await request('/students');
    assert(getStudentsRes.status === 200, 'GET /students returns 200 OK');
    assert(Array.isArray(getStudentsRes.body) && getStudentsRes.body.length > 0, 'GET /students returns array of students');

    // 2. GET /students/:id
    const getStudentRes = await request(`/students/${validStudentId}`);
    assert(getStudentRes.status === 200, `GET /students/${validStudentId} returns 200 OK`);
    assert(getStudentRes.body.id === validStudentId, 'Retrieved student ID matches');
    assert(typeof getStudentRes.body.name === 'string', 'Student contains "name"');

    // 3. GET /students/:id errors
    const studentInvalidIdRes = await request('/students/bad-id');
    assert(studentInvalidIdRes.status === 400, 'GET /students/bad-id returns 400 Bad Request');

    const studentNotFoundRes = await request('/students/999999');
    assert(studentNotFoundRes.status === 404, 'GET /students/999999 returns 404 Not Found');

    // 4. POST /students
    const uniqueEmail = `member3_test_${Date.now()}@example.com`;
    const createStudentRes = await request('/students', { method: 'POST' }, {
      name: 'Rohan Sharma',
      email: uniqueEmail,
    });
    assert(createStudentRes.status === 201, 'POST /students returns 201 Created');
    const createdStudent = createStudentRes.body.student || createStudentRes.body;
    assert(createdStudent && createdStudent.id > 0, 'Created student assigned valid ID');
    assert(createdStudent.name === 'Rohan Sharma', 'Created student has correct name');
    assert(createdStudent.email === uniqueEmail, 'Created student has correct email');

    // 5. POST /students validation
    const missingStudentNameRes = await request('/students', { method: 'POST' }, { email: 'no_name@example.com' });
    assert(missingStudentNameRes.status === 400, 'POST /students without name returns 400 Bad Request');

    const whitespaceStudentNameRes = await request('/students', { method: 'POST' }, { name: '   ' });
    assert(whitespaceStudentNameRes.status === 400, 'POST /students with whitespace name returns 400 Bad Request');

    // 6. Duplicate email constraint -> 400
    const duplicateEmailRes = await request('/students', { method: 'POST' }, {
      name: 'Another Student',
      email: uniqueEmail,
    });
    assert(duplicateEmailRes.status === 400, 'POST /students with duplicate email returns 400 Bad Request');

  } finally {
    server.close();
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

runMember3Tests().catch((err) => {
  console.error('Fatal test runner error in Member 3 suite:', err);
  process.exit(1);
});
