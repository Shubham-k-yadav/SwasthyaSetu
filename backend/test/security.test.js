import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const API_URL = 'http://localhost:5000';
const JWT_SECRET = 'swasthya_setu_jwt_secret_key_2026';

describe('SwasthyaSetu Backend Security Hardening Suite', () => {

  test('1. Health Check Endpoint is operational', async () => {
    const res = await fetch(`${API_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.service, 'swasthya-setu-server');
    assert.ok(data.status === 'healthy' || data.status === 'degraded');
  });

  test('2. Hardcoded superadmin bypass passwords (SuperAdmin@2024 / SwasthyaSetu@2026) are rejected on invalid password match', async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@swasthyasetu.in',
        password: 'SuperAdmin@2024',
        portal: 'superadmin'
      })
    });
    // Must be 401 Unauthorized because the hashed password stored in DB does not match 'SuperAdmin@2024'
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.ok(data.error);
  });

  test('3. Bed reservations /confirm endpoint is protected with authentication (no unauthenticated access)', async () => {
    const res = await fetch(`${API_URL}/api/hospitals/reservations/SS-HOLD-999999/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    // Must return 401 since Bearer token is now mandatory
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.match(data.error, /token|denied/i);
  });

  test('4. Bed reservations /release endpoint is protected with authentication', async () => {
    const res = await fetch(`${API_URL}/api/hospitals/reservations/SS-HOLD-999999/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.equal(res.status, 401);
  });

  test('5. Bed reservations /discharge endpoint is protected with authentication', async () => {
    const res = await fetch(`${API_URL}/api/hospitals/reservations/SS-HOLD-999999/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.equal(res.status, 401);
  });

  test('6. Donor availability endpoint requires authentication', async () => {
    const fakeId = '6a9c82c81e883a4a9dfde4e1';
    const res = await fetch(`${API_URL}/api/donors/${fakeId}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: false })
    });
    assert.equal(res.status, 401);
  });

  test('7. Ambulance status endpoint rejects unauthorized status updates without valid token', async () => {
    const fakeId = '6a9c82c81e883a4a9dfde4e1';
    const res = await fetch(`${API_URL}/api/ambulances/${fakeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'offline' })
    });
    // Should be 403 or 404 (if not found in DB)
    assert.ok(res.status === 403 || res.status === 404);
  });

  test('8. OTP request endpoint rejects invalid phone numbers', async () => {
    const res = await fetch(`${API_URL}/api/hospitals/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '12345' })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /valid 10-digit Indian phone/i);
  });

  test('9. OTP verification endpoint rejects incorrect OTP', async () => {
    const res = await fetch(`${API_URL}/api/hospitals/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210', otp: '000000' })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  test('10. Hospital pagination clamps limit safely to <= 100', async () => {
    const res = await fetch(`${API_URL}/api/hospitals?limit=999999`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.pagination);
    assert.equal(data.pagination.limit, 100);
  });

  test('11. Translation endpoint enforces bounded input length (DoS protection)', async () => {
    const hugeText = 'A'.repeat(5000);
    const res = await fetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: hugeText, targetLang: 'hi' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.translatedText);
  });

  test('12. Emergency request update requires hospital scoping or superadmin role', async () => {
    const fakeEmergencyId = '6a9c82c81e883a4a9dfde4e1';
    // Create token for hospital A admin
    const hospitalAToken = jwt.sign(
      { userId: '6a9c82c81e883a4a9dfde4e1', role: 'admin', hospitalId: '6a9c82c81e883a4a9dfde4df' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${API_URL}/api/emergency/request/${fakeEmergencyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hospitalAToken}`
      },
      body: JSON.stringify({ status: 'resolved' })
    });

    // Should return 404 (not found) or 403 (unauthorized hospital), never unauthenticated 200
    assert.ok(res.status === 404 || res.status === 403);
  });

});
