/**
 * ApexTrack Enterprise — Shipments Controller
 * Sprint 15: Full CRUD & RBAC Mutation Protocols
 */

const db = require('../models/db');

const shipmentsController = {
  // --- READ: List with Filters ---
  listShipments: (req, res) => {
    const { search, status, classification, priority } = req.query;
    const records = db.getShipments({ search, status, classification, priority });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      count: records.length,
      data: records
    });
  },

  // --- READ: Single by ID ---
  getShipment: (req, res) => {
    const { id } = req.params;
    const shipment = db.getShipmentById(id);

    if (!shipment) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        statusCode: 404,
        message: `No active shipment matching identifier '${id}' found in database model.`
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: shipment
    });
  },

  // --- CREATE: New Shipment (Admin / Dispatcher) ---
  createShipment: (req, res) => {
    const { origin, destination, cargoClassification, weightKg, priority, targetTempC, assignedVehicle, notes } = req.body || {};

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        statusCode: 400,
        message: 'Origin and destination hubs are required parameters.'
      });
    }

    const newRecord = db.createShipment(
      { origin, destination, cargoClassification, weightKg, priority, targetTempC, assignedVehicle, notes },
      req.user
    );

    return res.status(201).json({
      success: true,
      statusCode: 201,
      data: newRecord,
      message: `Shipment [${newRecord.trackingNumber}] successfully committed into database.`
    });
  },

  // --- UPDATE: Modify Shipment Fields (Admin / Dispatcher) ---
  updateShipment: (req, res) => {
    const { id } = req.params;
    const existing = db.getShipmentById(id);

    if (!existing) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        statusCode: 404,
        message: `Cannot update: Shipment '${id}' not found.`
      });
    }

    const updated = db.updateShipment(id, req.body, req.user);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: updated,
      message: `Shipment [${updated.trackingNumber}] successfully updated by ${req.user.username}.`
    });
  },

  // --- UPDATE: Transition Shipment Status (Admin / Dispatcher) ---
  updateStatus: (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    const validStatuses = ['DISPATCHED', 'IN_TRANSIT', 'HELD_CUSTOMS', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        statusCode: 400,
        message: `Status must be one of: [${validStatuses.join(', ')}]`
      });
    }

    const updated = db.updateShipmentStatus(id, status, req.user, notes);
    if (!updated) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        statusCode: 404,
        message: `Cannot update status: Shipment '${id}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: updated,
      message: `Shipment [${updated.trackingNumber}] transitioned to status [${status}].`
    });
  },

  // --- DELETE: Decommission Shipment (STRICTLY ADMIN ONLY) ---
  deleteShipment: (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};

    const deleted = db.deleteShipment(id, req.user, reason || 'Administrative Decommission');

    if (!deleted) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        statusCode: 404,
        message: `Cannot delete: Shipment '${id}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      deletedId: id,
      trackingNumber: deleted.trackingNumber,
      message: `Shipment [${deleted.trackingNumber}] permanently purged from fleet registry by Admin [${req.user.username}].`
    });
  }
};

module.exports = shipmentsController;
