/**
 * Automated Unit Test Suite: Phase 3 — Cluster Health & Observability
 * Sprint 15 Deliverable Verification
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const telemetryController = require('../src/controllers/telemetryController');
const db = require('../src/models/db');

describe('=== Phase 3: Cluster Health & Observability Unit Tests ===', () => {

  it('1. GET /api/analytics/summary reports system aggregates and fleet statistics', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {};
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

    telemetryController.getSummary(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseBody.success, true);
    assert.ok(typeof responseBody.data.totalShipments === 'number');
    assert.ok(typeof responseBody.data.totalTonnageTons === 'number');
    assert.ok(typeof responseBody.data.telemetryFramesBuffered === 'number');
  });

  it('2. Admin purge buffer: DELETE /api/telemetry/buffer empties buffer cache', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      user: { username: 'admin_marcus', role: 'ADMIN' }
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

    telemetryController.purgeBuffer(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseBody.success, true);
    assert.ok(responseBody.purgedCount >= 0);

    // Verify buffer is now empty
    const remaining = db.getTelemetry(100);
    assert.strictEqual(remaining.length, 0, 'Buffer must be empty after admin purge');
  });

  it('3. Audit trail: GET /api/audit/logs returns chronological record of system mutations', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = { query: { limit: 10 } };
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

    telemetryController.getAuditLogs(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseBody.success, true);
    assert.ok(responseBody.data.length > 0, 'Audit trail must contain entries');
    assert.ok(responseBody.data.some(log => log.action === 'PURGE_TELEMETRY'));
  });
});
