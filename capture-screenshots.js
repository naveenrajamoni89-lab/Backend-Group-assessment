const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://backend-group-assessment.onrender.com';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function captureUrl(url, filename, windowSize = '1200,800') {
  const outputPath = path.join(SCREENSHOT_DIR, filename);
  console.log(`[Capturing] ${url} -> ${filename}...`);
  try {
    const cmd = `"${CHROME_PATH}" --headless --disable-gpu --window-size=${windowSize} --screenshot="${outputPath}" "${url}"`;
    execSync(cmd, { stdio: 'pipe' });
    if (fs.existsSync(outputPath)) {
      console.log(`  ✓ Saved: ${filename} (${fs.statSync(outputPath).size} bytes)`);
    } else {
      console.error(`  ✗ Failed to save: ${filename}`);
    }
  } catch (err) {
    console.error(`  ✗ Error capturing ${url}:`, err.message);
  }
}

function renderHtmlCard(title, method, url, status, statusText, reqBody, resBody, filename) {
  const htmlPath = path.join(SCREENSHOT_DIR, `${filename}.html`);
  const outputPath = path.join(SCREENSHOT_DIR, filename);

  const methodColor = {
    GET: '#2563eb',
    POST: '#16a34a',
    PUT: '#d97706',
    DELETE: '#dc2626',
  }[method] || '#4b5563';

  const statusColor = status >= 200 && status < 300 ? '#16a34a' : (status >= 400 && status < 500 ? '#d97706' : '#dc2626');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #0f172a; color: #f8fafc; padding: 32px; display: flex; justify-content: center; }
    .container { width: 100%; max-width: 1050px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { background: #0f172a; padding: 16px 24px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; }
    .dots { display: flex; gap: 8px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }
    .url-bar { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 16px; font-family: 'Consolas', monospace; font-size: 13px; color: #94a3b8; flex-grow: 1; margin: 0 20px; }
    .content { padding: 24px; }
    .meta-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #334155; }
    .method-url { display: flex; align-items: center; gap: 12px; }
    .badge-method { background: ${methodColor}; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 14px; }
    .title-text { font-size: 18px; font-weight: 600; color: #f1f5f9; }
    .badge-status { background: ${statusColor}22; border: 1px solid ${statusColor}; color: ${statusColor}; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: monospace; }
    .section-title { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
    pre { background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; line-height: 1.5; color: #38bdf8; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
    .live-tag { color: #10b981; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="dots">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
      </div>
      <div class="url-bar">${url}</div>
      <div class="live-tag"><div class="live-dot"></div> Live on Render</div>
    </div>
    <div class="content">
      <div class="meta-bar">
        <div class="method-url">
          <span class="badge-method">${method}</span>
          <span class="title-text">${title}</span>
        </div>
        <span class="badge-status">HTTP ${status} ${statusText}</span>
      </div>
      ${reqBody ? `
        <div class="section-title">Request Body (JSON)</div>
        <pre style="color: #f59e0b;">${JSON.stringify(reqBody, null, 2)}</pre>
      ` : ''}
      <div class="section-title">Live Response Payload (JSON)</div>
      <pre>${JSON.stringify(resBody, null, 2)}</pre>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html);
  try {
    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    const cmd = `"${CHROME_PATH}" --headless --disable-gpu --window-size=1150,750 --screenshot="${outputPath}" "${fileUrl}"`;
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  ✓ Rendered & Captured: ${filename}`);
  } catch (err) {
    console.error(`  ✗ Error rendering ${filename}:`, err.message);
  } finally {
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
    }
  }
}

async function main() {
  console.log('====================================================');
  console.log(' StudySpot Cafe - Live Render Deployment Screenshot Suite');
  console.log(' Live URL: ' + BASE_URL);
  console.log('====================================================\n');

  // 1. Direct Browser URLs (GET endpoints)
  const getEndpoints = [
    { ep: '/', file: '01-get-root.png', name: 'GET Root Health & API Guide' },
    { ep: '/carrels', file: '02-get-carrels.png', name: 'GET All Study Carrels' },
    { ep: '/carrels/top', file: '03-get-carrels-top.png', name: 'GET Top 3 Carrels (Member 4 Twist)' },
    { ep: '/carrels?zone=Silent%20Study', file: '04-get-carrels-zone.png', name: 'GET Carrels Filtered by Zone' },
    { ep: '/carrels/1', file: '05-get-carrel-by-id.png', name: 'GET Single Carrel by ID' },
    { ep: '/students', file: '06-get-students.png', name: 'GET All Registered Students' },
    { ep: '/students/1', file: '07-get-student-by-id.png', name: 'GET Single Student by ID' },
    { ep: '/bookings', file: '08-get-bookings.png', name: 'GET All Bookings' },
    { ep: '/bookings/details', file: '09-get-bookings-details.png', name: 'GET Bookings with Details (JOIN)' },
    { ep: '/bookings/details/1', file: '10-get-booking-details-by-id.png', name: 'GET Single Booking Details (JOIN)' },
    { ep: '/bookings/1', file: '11-get-booking-by-id.png', name: 'GET Single Booking by ID' },
    { ep: '/carrels/not-a-number', file: '12-get-carrels-invalid-id-400.png', name: 'GET Carrel with Invalid ID (400 Bad Request)' },
    { ep: '/unknown-route', file: '13-get-unknown-route-404.png', name: 'GET Non-Existent Route (404 Not Found)' },
  ];

  console.log('--- Phase 1: Capturing Direct Browser Views for GET Endpoints ---');
  for (const item of getEndpoints) {
    const fullUrl = BASE_URL + item.ep;
    captureUrl(fullUrl, item.file);
  }

  // 2. Perform write operations live against the Render instance and capture them
  console.log('\n--- Phase 2: Performing Live Write Operations & Capturing Responses ---');

  // Operation A: POST /carrels
  const postCarrelBody = { name: 'Executive Pod X1', zone: 'Deep Focus' };
  const postCarrelRes = await fetch(BASE_URL + '/carrels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postCarrelBody),
  });
  const postCarrelData = await postCarrelRes.json();
  const createdCarrelId = postCarrelData.carrel ? postCarrelData.carrel.id : null;
  renderHtmlCard(
    'Create Study Carrel',
    'POST',
    `${BASE_URL}/carrels`,
    postCarrelRes.status,
    'Created',
    postCarrelBody,
    postCarrelData,
    '14-post-create-carrel.png'
  );

  // Operation B: PUT /carrels/:id
  let updatedCarrelData = null;
  if (createdCarrelId) {
    const putCarrelBody = { name: 'Executive Pod X1 (Upgraded Soundproof)', zone: 'Deep Focus' };
    const putRes = await fetch(`${BASE_URL}/carrels/${createdCarrelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(putCarrelBody),
    });
    updatedCarrelData = await putRes.json();
    renderHtmlCard(
      'Update Study Carrel by ID',
      'PUT',
      `${BASE_URL}/carrels/${createdCarrelId}`,
      putRes.status,
      'OK',
      putCarrelBody,
      updatedCarrelData,
      '15-put-update-carrel.png'
    );
  }

  // Operation C: POST /students
  const studentEmail = `student.live.${Date.now()}@example.com`;
  const postStudentBody = { name: 'Samantha Reed', email: studentEmail };
  const postStudentRes = await fetch(BASE_URL + '/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postStudentBody),
  });
  const postStudentData = await postStudentRes.json();
  const createdStudentId = postStudentData.student ? postStudentData.student.id : null;
  renderHtmlCard(
    'Register Student',
    'POST',
    `${BASE_URL}/students`,
    postStudentRes.status,
    'Created',
    postStudentBody,
    postStudentData,
    '16-post-create-student.png'
  );

  // Operation D: POST /bookings
  let createdBookingId = null;
  if (createdStudentId && createdCarrelId) {
    const postBookingBody = {
      student_id: createdStudentId,
      carrel_id: createdCarrelId,
      booking_date: '2026-11-25',
      booking_time: '10:00 - 12:00',
    };
    const postBookingRes = await fetch(BASE_URL + '/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBookingBody),
    });
    const postBookingData = await postBookingRes.json();
    createdBookingId = postBookingData.booking ? postBookingData.booking.id : null;
    renderHtmlCard(
      'Create New Carrel Booking',
      'POST',
      `${BASE_URL}/bookings`,
      postBookingRes.status,
      'Created',
      postBookingBody,
      postBookingData,
      '17-post-create-booking.png'
    );
  }

  // Operation E: DELETE /bookings/:id
  if (createdBookingId) {
    const delBookingRes = await fetch(`${BASE_URL}/bookings/${createdBookingId}`, {
      method: 'DELETE',
    });
    const delBookingData = await delBookingRes.json();
    renderHtmlCard(
      'Delete Booking by ID',
      'DELETE',
      `${BASE_URL}/bookings/${createdBookingId}`,
      delBookingRes.status,
      'OK',
      null,
      delBookingData,
      '18-delete-booking.png'
    );
  }

  // Operation F: DELETE /carrels/:id
  if (createdCarrelId) {
    const delCarrelRes = await fetch(`${BASE_URL}/carrels/${createdCarrelId}`, {
      method: 'DELETE',
    });
    const delCarrelData = await delCarrelRes.json();
    renderHtmlCard(
      'Delete Study Carrel by ID',
      'DELETE',
      `${BASE_URL}/carrels/${createdCarrelId}`,
      delCarrelRes.status,
      'OK',
      null,
      delCarrelData,
      '19-delete-carrel.png'
    );
  }

  console.log('\n====================================================');
  console.log(' All screenshots successfully captured in screenshots/');
  console.log('====================================================');
}

main().catch(console.error);

