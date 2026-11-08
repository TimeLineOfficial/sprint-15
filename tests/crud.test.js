/**
 * Automated Unit Test Suite: Phase 1 — Core CRUD Execution
 * Sprint 15 Feature Complete Deliverable Verification
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const shipmentsController = require('../src/controllers/shipmentsController');
const telemetryController = require('../src/controllers/telemetryController');
const db = require('../src/models/db');

describe('=== Phase 1: Core CRUD Execution Unit Tests ===', () => {

  const mockAdminUser = {
    username: 'admin_marcus',
    role: 'ADMIN',
    department: 'Fleet Ops'
  };

  let testTrackingNumber = '';
  let testShipmentId = '';

  it('1. CREATE: POST /api/shipments flawlessly commits new record to database layer', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      user: mockAdminUser,
      body: {
        origin: 'Atlanta Southeast Intermodal, GA',
        destination: 'Miami Port Hub, FL',
        cargoClassification: 'COLD_CHAIN_PHARMA',
        priority: 'CRITICAL',
        targetTempC: -20.0,
        weightKg: 6200,
        assignedVehicle: 'VEH-9912',
        notes: 'Critical vaccine payload.'
      }
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

    shipmentsController.createShipment(req, res);

    assert.strictEqual(responseStatus, 201, 'Expected HTTP 201 Created');
    assert.strictEqual(responseBody.success, true);
    assert.strictEqual(responseBody.data.origin, 'Atlanta Southeast Intermodal, GA');
    assert.strictEqual(responseBody.data.status, 'DISPATCHED');
    assert.strictEqual(responseBody.data.targetTempC, -20.0);

    testShipmentId = responseBody.data.id;
    testTrackingNumber = responseBody.data.trackingNumber;

    // Verify in db
    const inDb = db.getShipmentById(testShipmentId);
    assert.ok(inDb, 'Record must exist in db layer');
    assert.strictEqual(inDb.trackingNumber, testTrackingNumber);
  });

  it('2. READ: GET /api/shipments retrieves filtered shipment records', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      query: { search: 'Atlanta' }
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

    shipmentsController.listShipments(req, res);

    assert.strictEqual(responseStatus, 200, 'Expected HTTP 200 OK');
    assert.strictEqual(responseBody.success, true);
    assert.ok(responseBody.data.length >= 1, 'Should find at least 1 record matching Atlanta');
    assert.strictEqual(responseBody.data[0].id, testShipmentId);
  });

  it('3. READ: GET /api/shipments/:id retrieves single detailed shipment', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = { params: { id: testShipmentId } };
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

    shipmentsController.getShipment(req, res);

    assert.strictEqual(responseStatus, 200, 'Expected HTTP 200 OK');
    assert.strictEqual(responseBody.data.trackingNumber, testTrackingNumber);
  });

  it('4. UPDATE: PUT /api/shipments/:id updates cargo specifications and notes', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      user: mockAdminUser,
      params: { id: testShipmentId },
      body: {
        destination: 'Tampa Distribution Hub, FL',
        weightKg: 6450,
        notes: 'Rerouted due to severe weather.'
      }
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

    shipmentsController.updateShipment(req, res);

    assert.strictEqual(responseStatus, 200, 'Expected HTTP 200 OK');
    assert.strictEqual(responseBody.data.destination, 'Tampa Distribution Hub, FL');
    assert.strictEqual(responseBody.data.weightKg, 6450);
  });

  it('5. UPDATE: PATCH /api/shipments/:id/status transitions state to IN_TRANSIT', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      user: mockAdminUser,
      params: { id: testShipmentId },
      body: { status: 'IN_TRANSIT', notes: 'Vehicle departed Atlanta depot.' }
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

    shipmentsController.updateStatus(req, res);

    assert.strictEqual(responseStatus, 200, 'Expected HTTP 200 OK');
    assert.strictEqual(responseBody.data.status, 'IN_TRANSIT');
  });

  it('6. DELETE: DELETE /api/shipments/:id removes shipment from active registry', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      user: mockAdminUser,
      params: { id: testShipmentId },
      body: { reason: 'Test decommission cycle complete' }
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

    shipmentsController.deleteShipment(req, res);

    assert.strictEqual(responseStatus, 200, 'Expected HTTP 200 OK');
    assert.strictEqual(responseBody.deletedId, testShipmentId);

    // Verify no longer present
    const checkDb = db.getShipmentById(testShipmentId);
    assert.strictEqual(checkDb, null, 'Deleted shipment must no longer exist in db');
  });

  it('7. TELEMETRY: POST /api/telemetry/ingest buffers sensor frames into mesh', () => {
    let responseStatus = null;
    let responseBody = null;

    const req = {
      body: {
        vehicleId: 'VEH-8802',
        latitude: 42.1122,
        longitude: -71.2233,
        speedKmh: 92.4,
        cargoTempC: -20.2,
        batteryPercent: 86
      }
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

    telemetryController.ingest(req, res);

    assert.strictEqual(responseStatus, 202, 'Expected HTTP 202 Accepted');
    assert.strictEqual(responseBody.data.vehicleId, 'VEH-8802');
  });
});
