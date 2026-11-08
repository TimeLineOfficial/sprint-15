/**
 * Automated Unit Test Suite: Phase 2 — Role-Based Access Control (RBAC)
 * Sprint 15 Mandatory Deliverable Verification
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { authMiddleware, requireRole, JWT_SECRET } = require('../src/middleware/authMiddleware');
const authController = require('../src/controllers/authController');

describe('=== Phase 2: Role-Based Access Control (RBAC) Unit Tests ===', () => {

  const adminToken = jwt.sign(
    { sub: 'usr_admin_01', username: 'admin_marcus', role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const dispatcherToken = jwt.sign(
    { sub: 'usr_disp_01', username: 'dispatcher_elena', role: 'DISPATCHER' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const viewerToken = jwt.sign(
    { sub: 'usr_view_01', username: 'auditor_guest', role: 'VIEWER' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  it('1. POST /api/auth/login validates credentials and issues role-encoded JWT', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      body: { username: 'admin_marcus', password: 'admin123' }
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return res;
      }
    };

    authController.login(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseBody.success, true);
    assert.strictEqual(responseBody.user.role, 'ADMIN');
    assert.ok(responseBody.token, 'Must return signed token');
  });

  it('2. authMiddleware violently rejects missing Authorization header with HTTP 401', () => {
    let responseStatus = null;
    let responseBody = null;
    let nextCalled = false;

    const req = { headers: {} };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return res;
      }
    };

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Next must not be called');
    assert.strictEqual(responseStatus, 401);
    assert.strictEqual(responseBody.error, 'UNAUTHORIZED_PERIMETER_BREACH');
  });

  it('3. authMiddleware violently rejects forged or tampered JWT with HTTP 403', () => {
    let responseStatus = null;
    let responseBody = null;
    let nextCalled = false;

    const req = { headers: { authorization: 'Bearer forged.tampered.token' } };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return res;
      }
    };

    authMiddleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(responseStatus, 403);
    assert.strictEqual(responseBody.error, 'FORBIDDEN_INVALID_SIGNATURE');
  });

  it('4. requireRole([ADMIN]) grants clearance to authenticated ADMIN user', () => {
    let nextCalled = false;

    const req = {
      user: { username: 'admin_marcus', role: 'ADMIN' },
      originalUrl: '/api/shipments/shp_001'
    };
    const res = {};

    const guard = requireRole(['ADMIN']);
    guard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Admin must be granted access');
  });

  it('5. requireRole([ADMIN]) violently rejects DISPATCHER user with HTTP 403 Forbidden', () => {
    let responseStatus = null;
    let responseBody = null;
    let nextCalled = false;

    const req = {
      user: { username: 'dispatcher_elena', role: 'DISPATCHER' },
      originalUrl: '/api/shipments/shp_001'
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return res;
      }
    };

    const guard = requireRole(['ADMIN']);
    guard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Dispatcher must NOT be granted admin access');
    assert.strictEqual(responseStatus, 403, 'Must return HTTP 403 Forbidden');
    assert.strictEqual(responseBody.error, 'RBAC_ELEVATED_PRIVILEGE_REQUIRED');
    assert.strictEqual(responseBody.userRole, 'DISPATCHER');
    assert.deepStrictEqual(responseBody.requiredRoles, ['ADMIN']);
  });

  it('6. requireRole([ADMIN, DISPATCHER]) violently rejects VIEWER user with HTTP 403 Forbidden', () => {
    let responseStatus = null;
    let responseBody = null;
    let nextCalled = false;

    const req = {
      user: { username: 'auditor_guest', role: 'VIEWER' },
      originalUrl: '/api/shipments'
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return res;
      }
    };

    const guard = requireRole(['ADMIN', 'DISPATCHER']);
    guard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Viewer must NOT be granted mutation access');
    assert.strictEqual(responseStatus, 403, 'Must return HTTP 403 Forbidden');
    assert.strictEqual(responseBody.error, 'RBAC_ELEVATED_PRIVILEGE_REQUIRED');
    assert.strictEqual(responseBody.userRole, 'VIEWER');
  });
});
