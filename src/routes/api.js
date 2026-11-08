/**
 * ApexTrack Enterprise — API Routing Manifest
 * Sprint 15: Full CRUD & Strict Role-Based Access Control (RBAC)
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const shipmentsController = require('../controllers/shipmentsController');
const telemetryController = require('../controllers/telemetryController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// ============================================================================
// Public Endpoints
// ============================================================================
router.post('/auth/login', authController.login);
router.get('/auth/matrix', authController.getMatrix);

router.get('/health', (req, res) => {
  const nodeInstance = process.env.INSTANCE_ID || 'node-edge-primary';
  return res.status(200).json({
    status: 'HEALTHY',
    service: 'ApexTrack Enterprise Gateway',
    version: '3.0.0-feature-complete',
    clusterNode: nodeInstance,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Protected Endpoints — General Authenticated Access (ADMIN, DISPATCHER, VIEWER)
// ============================================================================
router.get('/auth/me', authMiddleware, authController.me);
router.get('/shipments', authMiddleware, shipmentsController.listShipments);
router.get('/shipments/:id', authMiddleware, shipmentsController.getShipment);
router.get('/telemetry', authMiddleware, telemetryController.list);
router.get('/analytics/summary', authMiddleware, telemetryController.getSummary);

// ============================================================================
// Mutation Endpoints — Requires Operational Privileges (ADMIN, DISPATCHER)
// Standard VIEWERS are violently rejected with 403 Forbidden.
// ============================================================================
router.post('/shipments', authMiddleware, requireRole(['ADMIN', 'DISPATCHER']), shipmentsController.createShipment);
router.put('/shipments/:id', authMiddleware, requireRole(['ADMIN', 'DISPATCHER']), shipmentsController.updateShipment);
router.patch('/shipments/:id/status', authMiddleware, requireRole(['ADMIN', 'DISPATCHER']), shipmentsController.updateStatus);
router.post('/telemetry/ingest', authMiddleware, requireRole(['ADMIN', 'DISPATCHER']), telemetryController.ingest);

// ============================================================================
// Elevated Administrative Endpoints — STRICTLY ADMIN ONLY
// Standard DISPATCHERS and VIEWERS are violently rejected with 403 Forbidden.
// ============================================================================
router.delete('/shipments/:id', authMiddleware, requireRole(['ADMIN']), shipmentsController.deleteShipment);
router.delete('/telemetry/buffer', authMiddleware, requireRole(['ADMIN']), telemetryController.purgeBuffer);
router.get('/audit/logs', authMiddleware, requireRole(['ADMIN']), telemetryController.getAuditLogs);

module.exports = router;
