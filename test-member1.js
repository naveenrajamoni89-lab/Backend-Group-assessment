/**
 * test-member1.js
 * Verification script for Member 1 deliverables:
 * 1. Verifies Express server and carrels route definitions.
 * 2. Tests input validation and HTTP 400 bad request responses.
 * 3. Tests 404 handler for unknown routes.
 * 4. Tests CRUD logic on carrels against SQLite (demonstrating exact query behavior).
 */

const http = require('http');
const { app } = require('./app');
const { getDatabase } = require('./database');

const runTests = async () => {
  console.log('====================================================');
  console.log(' StudySpot Cafe - Member 1 Verification Suite');
  console.log('====================================================\n');

  // 1. Start test server on random free port
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
      if (body) {
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
      if (details) console.error(`    ${details}`);
    }
  };

  try {
    // --- Test Group A: Root & General Server ---
    console.log('--- Group A: Express Server & Routing ---');
    const rootRes = await request('/');
    assert(rootRes.status === 200, 'GET / returns 200 OK');
    assert(rootRes.body.status === 'Server active', 'GET / returns health status message');

    const notFoundRes = await request('/unknown-route-123');
    assert(notFoundRes.status === 404, 'Unknown route returns 404 Not Found');

    // --- Test Group B: Route Validation (HTTP 400 Bad Request) ---
    console.log('\n--- Group B: Input Validation (HTTP 400 Bad Request) ---');

    // 1. Invalid ID format on GET /carrels/:id
    const invalidIdRes = await request('/carrels/not-a-number');
    assert(invalidIdRes.status === 400, 'GET /carrels/not-a-number returns 400');

    const negativeIdRes = await request('/carrels/-5');
    assert(negativeIdRes.status === 400, 'GET /carrels/-5 returns 400');

    // 2. Missing fields on POST /carrels
    const missingNameRes = await request('/carrels', { method: 'POST' }, { zone: 'Quiet Zone' });
    assert(missingNameRes.status === 400, 'POST /carrels without "name" returns 400');

    const missingZoneRes = await request('/carrels', { method: 'POST' }, { name: 'Carrel 1' });
    assert(missingZoneRes.status === 400, 'POST /carrels without "zone" returns 400');

    const emptyFieldsRes = await request('/carrels', { method: 'POST' }, { name: '   ', zone: '   ' });
    assert(emptyFieldsRes.status === 400, 'POST /carrels with whitespace only returns 400');

    // 3. Invalid ID format on PUT /carrels/:id
    const putInvalidIdRes = await request('/carrels/invalid', { method: 'PUT' }, { name: 'New Name', zone: 'Zone A' });
    assert(putInvalidIdRes.status === 400, 'PUT /carrels/invalid returns 400');

    // 4. Missing fields on PUT /carrels/:id
    const putMissingFieldRes = await request('/carrels/1', { method: 'PUT' }, { name: 'Only Name' });
    assert(putMissingFieldRes.status === 400, 'PUT /carrels/1 without "zone" returns 400');

    // 5. Invalid ID format on DELETE /carrels/:id
    const deleteInvalidIdRes = await request('/carrels/abc', { method: 'DELETE' });
    assert(deleteInvalidIdRes.status === 400, 'DELETE /carrels/abc returns 400');

    // --- Test Group C: Database Contract Verification ---
    console.log('\n--- Group C: Database CRUD Execution Verification ---');
    console.log('  Setting up temporary carrels table to verify all CRUD endpoints...');
    const db = await getDatabase();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS carrels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        zone TEXT NOT NULL
      );
      DELETE FROM carrels;
    `);

    // 1. POST /carrels (Create) -> 201 Created
    const createRes = await request('/carrels', { method: 'POST' }, {
      name: 'Silent Pod A1',
      zone: 'Silent Study',
    });
    assert(createRes.status === 201, 'POST /carrels returns 201 Created');
    assert(createRes.body.carrel && createRes.body.carrel.id === 1, 'Created carrel assigned id=1');
    assert(createRes.body.carrel.name === 'Silent Pod A1', 'Created carrel has correct name');
    assert(createRes.body.carrel.zone === 'Silent Study', 'Created carrel has correct zone');

    // 2. POST /carrels with explicit ID
    const createWithIdRes = await request('/carrels', { method: 'POST' }, {
      id: 5,
      name: 'Group Carrel G5',
      zone: 'Collaborative',
    });
    assert(createWithIdRes.status === 201, 'POST /carrels with explicit ID returns 201 Created');
    assert(createWithIdRes.body.carrel.id === 5, 'Explicit ID carrel has id=5');

    // Duplicate ID -> 400
    const dupRes = await request('/carrels', { method: 'POST' }, {
      id: 5,
      name: 'Duplicate',
      zone: 'Any',
    });
    assert(dupRes.status === 400, 'POST /carrels with duplicate ID returns 400 Bad Request');

    // 3. GET /carrels (Get all) -> 200 OK
    const getAllRes = await request('/carrels');
    assert(getAllRes.status === 200, 'GET /carrels returns 200 OK');
    assert(Array.isArray(getAllRes.body) && getAllRes.body.length === 2, 'GET /carrels returns 2 items');

    // 4. GET /carrels/:id (Get one) -> 200 OK
    const getOneRes = await request('/carrels/1');
    assert(getOneRes.status === 200, 'GET /carrels/1 returns 200 OK');
    assert(getOneRes.body.name === 'Silent Pod A1', 'GET /carrels/1 returns correct carrel data');

    // GET /carrels/:id (Not Found) -> 404
    const notFoundCarrelRes = await request('/carrels/999');
    assert(notFoundCarrelRes.status === 404, 'GET /carrels/999 returns 404 Not Found');

    // 5. PUT /carrels/:id (Update) -> 200 OK
    const updateRes = await request('/carrels/1', { method: 'PUT' }, {
      name: 'Silent Pod A1 - Renovated',
      zone: 'Deep Work Zone',
    });
    assert(updateRes.status === 200, 'PUT /carrels/1 returns 200 OK');
    assert(updateRes.body.carrel.name === 'Silent Pod A1 - Renovated', 'PUT updates carrel name');
    assert(updateRes.body.carrel.zone === 'Deep Work Zone', 'PUT updates carrel zone');

    // PUT non-existent -> 404
    const putNotFoundRes = await request('/carrels/999', { method: 'PUT' }, {
      name: 'Ghost',
      zone: 'Nowhere',
    });
    assert(putNotFoundRes.status === 404, 'PUT /carrels/999 returns 404 Not Found');

    // 6. DELETE /carrels/:id (Delete) -> 200 OK
    const deleteRes = await request('/carrels/1', { method: 'DELETE' });
    assert(deleteRes.status === 200, 'DELETE /carrels/1 returns 200 OK');

    // Verify deleted
    const verifyDeleteRes = await request('/carrels/1');
    assert(verifyDeleteRes.status === 404, 'GET /carrels/1 returns 404 after deletion');

    // DELETE non-existent -> 404
    const deleteNotFoundRes = await request('/carrels/999', { method: 'DELETE' });
    assert(deleteNotFoundRes.status === 404, 'DELETE /carrels/999 returns 404 Not Found');

    // Clean up test table so database schema remains Member 2's clean responsibility
    await db.exec('DROP TABLE IF EXISTS carrels;');
    console.log('  Cleaned up temporary table to preserve Member 2 scope.');

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

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
