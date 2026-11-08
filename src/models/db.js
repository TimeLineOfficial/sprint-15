/**
 * ApexTrack Enterprise — Database & Model Layer
 * Sprint 15 Feature Complete: Full CRUD & Telemetry Mesh
 */

class EnterpriseDatabase {
  constructor() {
    this.shipments = [
      {
        id: 'shp_001',
        trackingNumber: 'ATX-2026-901',
        origin: 'Boston Life Sciences Hub, MA',
        destination: 'Manhattan Medical Depot, NY',
        cargoClassification: 'COLD_CHAIN_PHARMA',
        priority: 'CRITICAL',
        targetTempC: -20.0,
        currentTempC: -19.4,
        weightKg: 4200,
        status: 'IN_TRANSIT',
        assignedVehicle: 'VEH-8802',
        dispatcher: 'dispatcher_elena',
        createdAt: '2026-11-08T08:00:00Z',
        updatedAt: '2026-11-08T14:30:00Z',
        notes: 'Priority mRNA batch. Continuous dry-ice telemetry monitoring required.'
      },
      {
        id: 'shp_002',
        trackingNumber: 'ATX-2026-902',
        origin: 'Chicago O\'Hare Air Hub, IL',
        destination: 'Detroit Autonomous Plant, MI',
        cargoClassification: 'HIGH_VALUE_ELECTRONICS',
        priority: 'HIGH',
        targetTempC: 18.0,
        currentTempC: 19.1,
        weightKg: 8500,
        status: 'DISPATCHED',
        assignedVehicle: 'VEH-4419',
        dispatcher: 'dispatcher_elena',
        createdAt: '2026-11-08T09:15:00Z',
        updatedAt: '2026-11-08T09:15:00Z',
        notes: 'Autonomous LiDAR sensor packages. Secure escort protocol active.'
      },
      {
        id: 'shp_003',
        trackingNumber: 'ATX-2026-903',
        origin: 'Austin Gigafactory Yard, TX',
        destination: 'Long Beach Terminal, CA',
        cargoClassification: 'AEROSPACE_COMPONENTS',
        priority: 'STANDARD',
        targetTempC: 22.0,
        currentTempC: 21.8,
        weightKg: 14200,
        status: 'HELD_CUSTOMS',
        assignedVehicle: 'VEH-2105',
        dispatcher: 'operator_sarah',
        createdAt: '2026-11-07T14:20:00Z',
        updatedAt: '2026-11-08T11:00:00Z',
        notes: 'Regulatory manifest re-verification requested by Port Authority.'
      },
      {
        id: 'shp_004',
        trackingNumber: 'ATX-2026-904',
        origin: 'Seattle Maritime Terminal, WA',
        destination: 'Vancouver Intermodal Hub, BC',
        cargoClassification: 'PERISHABLE_AGRI',
        priority: 'HIGH',
        targetTempC: 4.0,
        currentTempC: 3.8,
        weightKg: 11200,
        status: 'DELIVERED',
        assignedVehicle: 'VEH-7711',
        dispatcher: 'dispatcher_elena',
        createdAt: '2026-11-06T11:00:00Z',
        updatedAt: '2026-11-08T07:45:00Z',
        notes: 'Delivered and verified by Receiving Supervisor with zero thermal deviations.'
      }
    ];

    this.telemetry = [
      {
        id: 'tel_101',
        vehicleId: 'VEH-8802',
        latitude: 41.8240,
        longitude: -71.4128,
        speedKmh: 94.2,
        cargoTempC: -19.4,
        batteryPercent: 88,
        healthStatus: 'OPTIMAL',
        timestamp: '2026-11-08T17:40:00Z'
      },
      {
        id: 'tel_102',
        vehicleId: 'VEH-4419',
        latitude: 42.0329,
        longitude: -87.8890,
        speedKmh: 82.5,
        cargoTempC: 19.1,
        batteryPercent: 94,
        healthStatus: 'OPTIMAL',
        timestamp: '2026-11-08T17:41:00Z'
      },
      {
        id: 'tel_103',
        vehicleId: 'VEH-2105',
        latitude: 33.7701,
        longitude: -118.1937,
        speedKmh: 0.0,
        cargoTempC: 21.8,
        batteryPercent: 72,
        healthStatus: 'IDLE_PORT',
        timestamp: '2026-11-08T17:42:00Z'
      }
    ];

    this.auditLogs = [
      {
        id: 'aud_001',
        action: 'SYSTEM_BOOT',
        actor: 'system_daemon',
        target: 'mesh_controller',
        details: 'ApexTrack Enterprise Cluster v3.0 initialized across 3 NGINX load-balanced instances.',
        timestamp: new Date().toISOString()
      }
    ];
  }

  // --- CRUD: READ ---
  getShipments(filters = {}) {
    let result = [...this.shipments];
    const { search, status, classification, priority } = filters;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        (s.assignedVehicle && s.assignedVehicle.toLowerCase().includes(q))
      );
    }
    if (status) {
      result = result.filter(s => s.status === status);
    }
    if (classification) {
      result = result.filter(s => s.cargoClassification === classification);
    }
    if (priority) {
      result = result.filter(s => s.priority === priority);
    }

    return result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getShipmentById(id) {
    return this.shipments.find(s => s.id === id || s.trackingNumber === id) || null;
  }

  // --- CRUD: CREATE ---
  createShipment(data, actor = 'anonymous') {
    const id = `shp_${Date.now()}`;
    const newRecord = {
      id,
      trackingNumber: data.trackingNumber || `ATX-2026-${Math.floor(100 + Math.random() * 899)}`,
      origin: data.origin,
      destination: data.destination,
      cargoClassification: data.cargoClassification || 'STANDARD_FREIGHT',
      priority: data.priority || 'STANDARD',
      targetTempC: data.targetTempC !== undefined ? parseFloat(data.targetTempC) : 20.0,
      currentTempC: data.currentTempC !== undefined ? parseFloat(data.currentTempC) : 20.0,
      weightKg: parseFloat(data.weightKg) || 1000,
      status: 'DISPATCHED',
      assignedVehicle: data.assignedVehicle || `VEH-${Math.floor(1000 + Math.random() * 8999)}`,
      dispatcher: actor.username || actor || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: data.notes || 'Dispatched via Enterprise API Controller.'
    };

    this.shipments.unshift(newRecord);
    this.recordAudit('CREATE_SHIPMENT', actor, newRecord.trackingNumber, `Dispatched shipment ${newRecord.trackingNumber} to ${newRecord.destination}`);
    return newRecord;
  }

  // --- CRUD: UPDATE ---
  updateShipment(id, updates, actor = 'anonymous') {
    const shipment = this.getShipmentById(id);
    if (!shipment) return null;

    const allowedFields = ['origin', 'destination', 'cargoClassification', 'priority', 'targetTempC', 'currentTempC', 'weightKg', 'assignedVehicle', 'notes', 'status'];
    const changes = [];

    for (const key of allowedFields) {
      if (updates[key] !== undefined && updates[key] !== shipment[key]) {
        changes.push(`${key}: ${shipment[key]} -> ${updates[key]}`);
        shipment[key] = updates[key];
      }
    }

    shipment.updatedAt = new Date().toISOString();
    this.recordAudit('UPDATE_SHIPMENT', actor, shipment.trackingNumber, `Updated fields: [${changes.join(', ')}]`);
    return shipment;
  }

  updateShipmentStatus(id, newStatus, actor = 'anonymous', notes = '') {
    const shipment = this.getShipmentById(id);
    if (!shipment) return null;

    const prevStatus = shipment.status;
    shipment.status = newStatus;
    shipment.updatedAt = new Date().toISOString();
    if (notes) shipment.notes = notes;

    this.recordAudit('STATUS_TRANSITION', actor, shipment.trackingNumber, `Status changed from ${prevStatus} to ${newStatus}`);
    return shipment;
  }

  // --- CRUD: DELETE (RBAC ADMIN ONLY) ---
  deleteShipment(id, actor = 'anonymous', reason = 'Administrative Decommission') {
    const index = this.shipments.findIndex(s => s.id === id || s.trackingNumber === id);
    if (index === -1) return null;

    const deletedRecord = this.shipments.splice(index, 1)[0];
    this.recordAudit('DELETE_SHIPMENT', actor, deletedRecord.trackingNumber, `Administrative purge: ${reason}`);
    return deletedRecord;
  }

  // --- TELEMETRY CRUD ---
  ingestTelemetry(reading) {
    const frame = {
      id: `tel_${Date.now()}`,
      vehicleId: reading.vehicleId,
      latitude: parseFloat(reading.latitude),
      longitude: parseFloat(reading.longitude),
      speedKmh: parseFloat(reading.speedKmh) || 0.0,
      cargoTempC: parseFloat(reading.cargoTempC) || 20.0,
      batteryPercent: parseInt(reading.batteryPercent, 10) || 100,
      healthStatus: reading.healthStatus || 'OPTIMAL',
      timestamp: new Date().toISOString()
    };

    this.telemetry.unshift(frame);
    if (this.telemetry.length > 200) this.telemetry.pop();

    // Check temp violation against active shipments
    const linkedShipment = this.shipments.find(s => s.assignedVehicle === frame.vehicleId);
    if (linkedShipment) {
      linkedShipment.currentTempC = frame.cargoTempC;
      linkedShipment.updatedAt = frame.timestamp;
      const deviation = Math.abs(frame.cargoTempC - linkedShipment.targetTempC);
      if (deviation > 3.0) {
        this.recordAudit('THERMAL_BREACH_ALERT', 'telemetry_daemon', linkedShipment.trackingNumber, `Temp deviation ${deviation.toFixed(1)}°C (Target: ${linkedShipment.targetTempC}°C, Reading: ${frame.cargoTempC}°C)`);
      }
    }

    return frame;
  }

  getTelemetry(limit = 50) {
    return this.telemetry.slice(0, limit);
  }

  purgeTelemetry(actor = 'anonymous') {
    const count = this.telemetry.length;
    this.telemetry = [];
    this.recordAudit('PURGE_TELEMETRY', actor, 'telemetry_buffer', `Purged ${count} buffer frames from active telemetry stream.`);
    return { purgedCount: count };
  }

  // --- AUDIT & ANALYTICS ---
  recordAudit(action, actor, target, details) {
    const actorName = typeof actor === 'object' && actor ? actor.username : actor;
    const log = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action,
      actor: actorName,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 100) this.auditLogs.pop();
    return log;
  }

  getAuditLogs(limit = 50) {
    return this.auditLogs.slice(0, limit);
  }

  getAnalyticsSummary() {
    const total = this.shipments.length;
    const inTransit = this.shipments.filter(s => s.status === 'IN_TRANSIT').length;
    const delivered = this.shipments.filter(s => s.status === 'DELIVERED').length;
    const customs = this.shipments.filter(s => s.status === 'HELD_CUSTOMS').length;
    const dispatched = this.shipments.filter(s => s.status === 'DISPATCHED').length;
    const totalTonnage = this.shipments.reduce((acc, s) => acc + (s.weightKg || 0), 0) / 1000;

    return {
      totalShipments: total,
      inTransit,
      delivered,
      customs,
      dispatched,
      totalTonnageTons: parseFloat(totalTonnage.toFixed(2)),
      telemetryFramesBuffered: this.telemetry.length,
      auditRecordsCount: this.auditLogs.length
    };
  }
}

const db = new EnterpriseDatabase();
module.exports = db;
