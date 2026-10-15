import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { db } from '../src/db/store.js';

// Import routes
import authRoutes from '../src/routes/authRoutes.js';
import spaceRoutes from '../src/routes/spaceRoutes.js';
import messageRoutes from '../src/routes/messageRoutes.js';
import memoryRoutes from '../src/routes/memoryRoutes.js';
import locationRoutes from '../src/routes/locationRoutes.js';
import milestoneRoutes from '../src/routes/milestoneRoutes.js';

// Setup test Express server
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/space', spaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/milestones', milestoneRoutes);

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body: json };
};

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. Health check returns status ok', async () => {
  const res = await request('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('2. Authentication flow: Register and Login', async () => {
  const testEmail = `test_${Date.now()}@test.id`;

  // Register
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email: testEmail,
      password: 'password123',
      fullName: 'Budi Santoso',
      nickname: 'Budi'
    }
  });

  assert.equal(regRes.status, 201);
  assert.ok(regRes.body.token);
  assert.equal(regRes.body.user.nickname, 'Budi');

  // Login
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: 'password123'
    }
  });

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.token);

  // Protected route /api/auth/me
  const meRes = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${loginRes.body.token}` }
  });

  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.user.email, testEmail);
});

test('3. Quick login for Asit and Nisya', async () => {
  const asitRes = await request('/api/auth/quick-login/asit', { method: 'POST' });
  assert.equal(asitRes.status, 200);
  assert.equal(asitRes.body.user.nickname, 'Asit');
  assert.ok(asitRes.body.token);

  const nisyaRes = await request('/api/auth/quick-login/nisya', { method: 'POST' });
  assert.equal(nisyaRes.status, 200);
  assert.equal(nisyaRes.body.user.nickname, 'Nisya');
  assert.ok(nisyaRes.body.token);
});

test('4. Couple space creation & single-use invitation enforcement', async () => {
  // Create User X
  const regX = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email: `user_x_${Date.now()}@test.id`,
      password: 'password123',
      fullName: 'User X',
      nickname: 'X'
    }
  });
  const tokenX = regX.body.token;

  // Create Space
  const spaceRes = await request('/api/space', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenX}` },
    body: { name: 'Ruang Uji Coba' }
  });
  assert.equal(spaceRes.status, 201);
  assert.equal(spaceRes.body.space.name, 'Ruang Uji Coba');

  // Create single-use invitation code
  const invRes = await request('/api/space/invite', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenX}` }
  });
  assert.equal(invRes.status, 201);
  const inviteCode = invRes.body.invitation.code;
  assert.ok(inviteCode.startsWith('KITA-'));

  // Create User Y
  const regY = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email: `user_y_${Date.now()}@test.id`,
      password: 'password123',
      fullName: 'User Y',
      nickname: 'Y'
    }
  });
  const tokenY = regY.body.token;

  // User Y joins with code
  const joinRes = await request('/api/space/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenY}` },
    body: { code: inviteCode }
  });
  assert.equal(joinRes.status, 200);
  assert.equal(joinRes.body.space.status, 'paired');

  // Create User Z (Third party who is NOT yet in a space)
  const regZ = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email: `user_z_${Date.now()}@test.id`,
      password: 'password123',
      fullName: 'User Z (Third Person)',
      nickname: 'Z'
    }
  });
  const tokenZ = regZ.body.token;

  // Single-use enforcement: Attempting to join with the ALREADY USED code must return 404
  const reuseRes = await request('/api/space/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenZ}` },
    body: { code: inviteCode }
  });
  assert.equal(reuseRes.status, 404);

  // 2-member limit enforcement: Attempting to generate invitation for an already-full space (2 members) must fail
  const fullRes = await request('/api/space/invite', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenX}` }
  });
  assert.equal(fullRes.status, 400);
});

test('5. Realtime Messages: send, react, edit, delete', async () => {
  const asit = await request('/api/auth/quick-login/asit', { method: 'POST' });
  const tokenAsit = asit.body.token;

  // Send message
  const sendRes = await request('/api/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenAsit}` },
    body: {
      content: 'Halo Nisya sayang, ini pesan tes ❤️',
      message_type: 'text'
    }
  });
  assert.equal(sendRes.status, 201);
  const msgId = sendRes.body.message.id;

  // React to message
  const reactRes = await request(`/api/messages/${msgId}/reaction`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenAsit}` },
    body: { reaction: '❤️' }
  });
  assert.equal(reactRes.status, 200);

  // Edit message
  const editRes = await request(`/api/messages/${msgId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenAsit}` },
    body: { content: 'Halo Nisya sayang, ini pesan yang diedit ❤️' }
  });
  assert.equal(editRes.status, 200);
  assert.equal(editRes.body.data.content, 'Halo Nisya sayang, ini pesan yang diedit ❤️');

  // Delete message
  const delRes = await request(`/api/messages/${msgId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenAsit}` }
  });
  assert.equal(delRes.status, 200);
});

test('6. Mutual location consent & privacy checks', async () => {
  const asit = await request('/api/auth/quick-login/asit', { method: 'POST' });
  const nisya = await request('/api/auth/quick-login/nisya', { method: 'POST' });

  // Nisya turns sharing OFF
  await request('/api/location/toggle-consent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${nisya.body.token}` },
    body: { is_sharing_enabled: false }
  });

  // Asit checks partner location: Must NOT disclose Nisya coordinates
  const locCheck1 = await request('/api/location', {
    headers: { Authorization: `Bearer ${asit.body.token}` }
  });
  assert.equal(locCheck1.status, 200);
  assert.equal(locCheck1.body.partner_location.latitude, null);
  assert.equal(locCheck1.body.partner_location.longitude, null);
  assert.equal(locCheck1.body.partner_location.is_sharing_enabled, false);

  // Nisya turns sharing ON
  await request('/api/location/toggle-consent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${nisya.body.token}` },
    body: { is_sharing_enabled: true }
  });

  // Nisya updates coordinates
  await request('/api/location/update', {
    method: 'POST',
    headers: { Authorization: `Bearer ${nisya.body.token}` },
    body: {
      latitude: -6.2297,
      longitude: 106.8167,
      accuracy: 10,
      status_note: 'Di rumah baca buku 📖',
      battery_level: 95
    }
  });

  // Asit checks partner location: Now permitted!
  const locCheck2 = await request('/api/location', {
    headers: { Authorization: `Bearer ${asit.body.token}` }
  });
  assert.equal(locCheck2.status, 200);
  assert.equal(locCheck2.body.partner_location.latitude, -6.2297);
  assert.equal(locCheck2.body.partner_location.longitude, 106.8167);
  assert.equal(locCheck2.body.partner_location.is_sharing_enabled, true);

  // Clear location history
  const clearRes = await request('/api/location/history', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${nisya.body.token}` }
  });
  assert.equal(clearRes.status, 200);
});

test('7. Special Dates & Milestones', async () => {
  const asit = await request('/api/auth/quick-login/asit', { method: 'POST' });

  const addRes = await request('/api/milestones', {
    method: 'POST',
    headers: { Authorization: `Bearer ${asit.body.token}` },
    body: {
      title: 'Hari Jadi Pertama',
      event_date: '2024-08-14',
      notes: 'Satu tahun bersama'
    }
  });
  assert.equal(addRes.status, 201);
  const mileId = addRes.body.milestone.id;

  const listRes = await request('/api/milestones', {
    headers: { Authorization: `Bearer ${asit.body.token}` }
  });
  assert.equal(listRes.status, 200);
  assert.ok(listRes.body.milestones.some((m) => m.id === mileId));

  // Delete
  const delRes = await request(`/api/milestones/${mileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${asit.body.token}` }
  });
  assert.equal(delRes.status, 200);
});
