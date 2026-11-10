/**
 * test-member4.js
 * Comprehensive automated verification suite for Member 4 deliverables:
 * 1. GET /carrels/top endpoint functionality & HTTP status codes.
 * 2. Database query logic with INNER JOIN, GROUP BY, COUNT, ORDER BY, LIMIT.
 * 3. Sorting by booking_count in descending order.
 * 4. Alphabetical tie-breaking on carrel name when booking counts are equal.
 * 5. Return limit of at most 3 carrels.
 * 6. Exclusion of carrels with 0 bookings (INNER JOIN verification).
 * 7. Verification that route order prevents conflict between /carrels/top and /carrels/:id.
 */

const http = require('http');
const { app } = require('./app');
const {
  getDatabase,
  initializeDatabase,
  getTopCarrels,
  getAllCarrels,
  getAllStudents,
  insertBooking,
} = require('./database');

const runMember4Tests = async () => {
  console.log('====================================================');
  console.log(' StudySpot Cafe - Member 4 Verification Suite');
  console.log(' Top 3 Carrels Feature & Route Verification');
  console.log('====================================================\n');

  // Start test server on random free port
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
    const db = await initializeDatabase();

    // ------------------------------------------------------------------------
    // Group 1: Basic Endpoint & Schema Structure
    // ------------------------------------------------------------------------
    console.log('--- Group 1: GET /carrels/top Endpoint & Response Structure ---');

    const topRes = await request('/carrels/top');
    assert(topRes.status === 200, 'GET /carrels/top returns 200 OK');
    assert(Array.isArray(topRes.body), 'GET /carrels/top returns an array');
    assert(topRes.body.length <= 3, 'GET /carrels/top returns at most 3 carrels');

    if (topRes.body.length > 0) {
      const first = topRes.body[0];
      assert(typeof first.id === 'number', 'Result contains numeric carrel "id"');
      assert(typeof first.name === 'string', 'Result contains string carrel "name"');
      assert(typeof first.zone === 'string', 'Result contains string carrel "zone"');
      assert(typeof first.booking_count === 'number', 'Result contains numeric "booking_count"');
    }

    // ------------------------------------------------------------------------
    // Group 2: Route Shadowing & Conflict Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Group 2: Route Shadowing & Conflict Verification ---');

    // Make sure GET /carrels/top is not treated as GET /carrels/:id with id="top"
    assert(topRes.status !== 400, 'GET /carrels/top is not intercepted by /carrels/:id (no 400 Bad Request)');
    assert(topRes.status !== 404, 'GET /carrels/top is not 404 Not Found');

    // Make sure GET /carrels/:id still functions properly
    const existingCarrels = await getAllCarrels();
    const testId = existingCarrels.length > 0 ? existingCarrels[0].id : 1;
    const singleRes = await request(`/carrels/${testId}`);
    assert(singleRes.status === 200, `GET /carrels/${testId} still resolves correctly via /:id`);

    const invalidIdRes = await request('/carrels/not-an-id');
    assert(invalidIdRes.status === 400, 'GET /carrels/not-an-id correctly returns 400 via /:id');

    // ------------------------------------------------------------------------
    // Group 3: Ranking, Ties & Inner Join Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Group 3: Ranking, Ties & INNER JOIN Logic ---');

    // Setup controlled test scenario in database
    // Clear bookings to test exact counts
    await db.run('DELETE FROM bookings');

    // Ensure we have known carrels
    await db.run('DELETE FROM carrels');
    await db.run("INSERT INTO carrels (id, name, zone) VALUES (1, 'Alpha Pod', 'Quiet')");
    await db.run("INSERT INTO carrels (id, name, zone) VALUES (2, 'Beta Booth', 'Silent')");
    await db.run("INSERT INTO carrels (id, name, zone) VALUES (3, 'Gamma Table', 'Collab')");
    await db.run("INSERT INTO carrels (id, name, zone) VALUES (4, 'Delta Room', 'Meeting')");
    await db.run("INSERT INTO carrels (id, name, zone) VALUES (5, 'Epsilon Space', 'Open')");

    // Ensure we have a student
    const student = await db.get('SELECT id FROM students LIMIT 1');
    const studentId = student.id;

    // Add bookings:
    // Carrel 3 (Gamma Table): 4 bookings
    // Carrel 1 (Alpha Pod): 2 bookings
    // Carrel 2 (Beta Booth): 2 bookings  (Tied with Alpha Pod, but 'Alpha Pod' < 'Beta Booth' alphabetically)
    // Carrel 4 (Delta Room): 1 booking
    // Carrel 5 (Epsilon Space): 0 bookings (should NOT be returned due to INNER JOIN and LIMIT 3)
    await insertBooking({ student_id: studentId, carrel_id: 3, booking_date: '2026-11-10', booking_time: '09:00' });
    await insertBooking({ student_id: studentId, carrel_id: 3, booking_date: '2026-11-10', booking_time: '10:00' });
    await insertBooking({ student_id: studentId, carrel_id: 3, booking_date: '2026-11-10', booking_time: '11:00' });
    await insertBooking({ student_id: studentId, carrel_id: 3, booking_date: '2026-11-10', booking_time: '12:00' });

    await insertBooking({ student_id: studentId, carrel_id: 1, booking_date: '2026-11-10', booking_time: '13:00' });
    await insertBooking({ student_id: studentId, carrel_id: 1, booking_date: '2026-11-10', booking_time: '14:00' });

    await insertBooking({ student_id: studentId, carrel_id: 2, booking_date: '2026-11-10', booking_time: '15:00' });
    await insertBooking({ student_id: studentId, carrel_id: 2, booking_date: '2026-11-10', booking_time: '16:00' });

    await insertBooking({ student_id: studentId, carrel_id: 4, booking_date: '2026-11-10', booking_time: '17:00' });

    // Test getTopCarrels helper directly
    const directResults = await getTopCarrels(3);
    assert(directResults.length === 3, 'getTopCarrels(3) returns exactly 3 carrels');
    assert(directResults[0].id === 3, 'Top carrel is Gamma Table (id 3)');
    assert(directResults[0].booking_count === 4, 'Top carrel booking count is 4');
    assert(directResults[1].id === 1, 'Second carrel is Alpha Pod (id 1) due to tie-breaker Alpha < Beta');
    assert(directResults[1].booking_count === 2, 'Second carrel booking count is 2');
    assert(directResults[2].id === 2, 'Third carrel is Beta Booth (id 2)');
    assert(directResults[2].booking_count === 2, 'Third carrel booking count is 2');

    // Test via HTTP GET /carrels/top
    const httpTop = await request('/carrels/top');
    assert(httpTop.status === 200, 'GET /carrels/top returns 200 OK under test data');
    assert(httpTop.body.length === 3, 'GET /carrels/top returns exactly 3 records');
    assert(httpTop.body[0].name === 'Gamma Table', 'First place is Gamma Table');
    assert(httpTop.body[1].name === 'Alpha Pod', 'Second place is Alpha Pod (tie-breaker alphabetical)');
    assert(httpTop.body[2].name === 'Beta Booth', 'Third place is Beta Booth (tie-breaker alphabetical)');

    // Verify INNER JOIN exclusion: Carrel 5 has 0 bookings, should not appear
    const containsCarrel5 = httpTop.body.some((c) => c.id === 5);
    assert(!containsCarrel5, 'Carrel 5 (0 bookings) is excluded');

    // ------------------------------------------------------------------------
    // Group 4: Empty Bookings State (Graceful Handling)
    // ------------------------------------------------------------------------
    console.log('\n--- Group 4: Empty Bookings Handling ---');
    await db.run('DELETE FROM bookings');
    const emptyTopRes = await request('/carrels/top');
    assert(emptyTopRes.status === 200, 'GET /carrels/top returns 200 OK when no bookings exist');
    assert(Array.isArray(emptyTopRes.body), 'Returns an array when no bookings exist');
    assert(emptyTopRes.body.length === 0, 'Returns empty array [] when no carrels have bookings (INNER JOIN)');

    // Restore standard initial database state for consistent team development
    await db.run('DELETE FROM bookings');
    await db.run('DELETE FROM carrels');
    await db.run('DELETE FROM students');
    await initializeDatabase();
    console.log('\n[Database] Restored initial seed state for team integration.');
  } catch (error) {
    console.error('Fatal test runner error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(` Results: ${passed} / ${total} tests passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
};

if (require.main === module) {
  runMember4Tests();
}

module.exports = { runMember4Tests };
