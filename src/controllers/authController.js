/**
 * ApexTrack Enterprise — Auth Controller
 * Sprint 15: Role-Based Identity Perimeter
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const db = require('../models/db');

// Enterprise Identity Registry
const USER_REGISTRY = [
  {
    id: 'usr_admin_01',
    username: 'admin_marcus',
    password: 'admin123',
    role: 'ADMIN',
    department: 'Global Infrastructure & Fleet Operations',
    displayName: 'Marcus Vance (Chief Systems Admin)'
  },
  {
    id: 'usr_admin_02',
    username: 'fleet_director',
    password: 'director2026',
    role: 'ADMIN',
    department: 'Executive Operations',
    displayName: 'Diana Sterling (Fleet Director)'
  },
  {
    id: 'usr_disp_01',
    username: 'dispatcher_elena',
    password: 'dispatch123',
    role: 'DISPATCHER',
    department: 'North American Intermodal Logistics',
    displayName: 'Elena Rostova (Lead Dispatcher)'
  },
  {
    id: 'usr_disp_02',
    username: 'operator_sarah',
    password: 'operator123',
    role: 'DISPATCHER',
    department: 'Regional Dispatch Desk 4',
    displayName: 'Sarah Chen (Ops Controller)'
  },
  {
    id: 'usr_view_01',
    username: 'auditor_guest',
    password: 'guest123',
    role: 'VIEWER',
    department: 'Third-Party Compliance & Safety Audit',
    displayName: 'Guest Auditor (Read-Only Safety Auditor)'
  }
];

const authController = {
  login: (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        statusCode: 400,
        message: 'Username and password are required fields.'
      });
    }

    const matchedUser = USER_REGISTRY.find(
      u => u.username === username.trim() && u.password === password
    );

    if (!matchedUser) {
      db.recordAudit('AUTH_FAILED', username, 'api/auth/login', 'Invalid password or username provided.');
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        statusCode: 401,
        message: 'Authentication failed: Invalid username or password provided.'
      });
    }

    const payload = {
      sub: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role,
      department: matchedUser.department,
      displayName: matchedUser.displayName,
      iss: 'apextrack.enterprise.auth',
      aud: 'apextrack-mesh-cluster'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    db.recordAudit(
      'AUTH_LOGIN_SUCCESS',
      matchedUser.username,
      'api/auth/login',
      `Session established for role [${matchedUser.role}]. Clearance: ${matchedUser.department}`
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      token,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        role: matchedUser.role,
        department: matchedUser.department,
        displayName: matchedUser.displayName
      },
      message: 'Authentication successful. JWT access token issued.'
    });
  },

  me: (req, res) => {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      user: req.user
    });
  },

  getMatrix: (req, res) => {
    return res.status(200).json({
      success: true,
      authorizationMatrix: {
        ADMIN: {
          elevated: true,
          capabilities: ['CREATE_SHIPMENT', 'READ_ALL', 'UPDATE_FULL', 'UPDATE_STATUS', 'DELETE_SHIPMENT', 'PURGE_TELEMETRY', 'SYSTEM_AUDIT_LOGS', 'OVERRIDE_THRESHOLDS']
        },
        DISPATCHER: {
          elevated: false,
          capabilities: ['CREATE_SHIPMENT', 'READ_ALL', 'UPDATE_STATUS', 'UPDATE_BASIC'],
          restricted: ['DELETE_SHIPMENT', 'PURGE_TELEMETRY', 'SYSTEM_AUDIT_LOGS']
        },
        VIEWER: {
          elevated: false,
          capabilities: ['READ_ALL'],
          restricted: ['CREATE_SHIPMENT', 'UPDATE_FULL', 'UPDATE_STATUS', 'DELETE_SHIPMENT', 'PURGE_TELEMETRY']
        }
      }
    });
  }
};

module.exports = authController;
