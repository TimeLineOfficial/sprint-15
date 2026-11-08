/**
 * ApexTrack Enterprise — Telemetry & Analytics Controller
 * Sprint 15: Ingestion, Caching, and Admin Purge Protocols
 */

const db = require('../models/db');

const telemetryController = {
  ingest: (req, res) => {
    const { vehicleId, latitude, longitude, speedKmh, cargoTempC, batteryPercent, healthStatus } = req.body || {};

    if (!vehicleId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'INVALID_TELEMETRY_FRAME',
        statusCode: 400,
        message: 'Telemetry payload requires vehicleId, latitude, and longitude coordinates.'
      });
    }

    const frame = db.ingestTelemetry({
      vehicleId,
      latitude,
      longitude,
      speedKmh,
      cargoTempC,
      batteryPercent,
      healthStatus
    });

    return res.status(202).json({
      success: true,
      statusCode: 202,
      data: frame,
      message: `Telemetry frame [${frame.id}] buffered into mesh data layer.`
    });
  },

  list: (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const readings = db.getTelemetry(limit);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      count: readings.length,
      data: readings
    });
  },

  purgeBuffer: (req, res) => {
    // Phase 2 RBAC ensures only ADMIN reaches here
    const result = db.purgeTelemetry(req.user);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      purgedCount: result.purgedCount,
      message: `Admin [${req.user.username}] successfully purged ${result.purgedCount} telemetry frames from buffer cache.`
    });
  },

  getSummary: (req, res) => {
    const summary = db.getAnalyticsSummary();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: summary
    });
  },

  getAuditLogs: (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = db.getAuditLogs(limit);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      count: logs.length,
      data: logs
    });
  }
};

module.exports = telemetryController;
