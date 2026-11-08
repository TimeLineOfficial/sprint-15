/**
 * ApexTrack Enterprise — Auth & Role-Based Access Control (RBAC) Middleware
 * Sprint 15 Phase 2: Strict Authorization Matrices
 */

const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'apextrack-enterprise-production-jwt-hmac-sha256-key-99812';

/**
 * Validates JWT Bearer clearance.
 * Violently rejects unauthorized callers with HTTP 401.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_PERIMETER_BREACH',
      statusCode: 401,
      message: 'Route guard violently rejected request: No Authorization Bearer header supplied.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'MALFORMED_AUTHORIZATION_HEADER',
      statusCode: 401,
      message: 'Authorization header must adhere strictly to format: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'FORBIDDEN_INVALID_SIGNATURE',
      statusCode: 403,
      message: `Cryptographic token verification failed: ${err.message}`
    });
  }
}

/**
 * Strict Role-Based Access Control (RBAC) Middleware.
 * Violently rejects authenticated callers lacking the required role with HTTP 403.
 *
 * @param {string[]} allowedRoles Array of permissible roles, e.g. ['ADMIN']
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        statusCode: 401,
        message: 'RBAC verification requires active authentication perimeter.'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const authorized = allowedRoles.map(r => r.toUpperCase()).includes(userRole);

    if (!authorized) {
      db.recordAudit(
        'RBAC_ACCESS_DENIED',
        req.user.username || 'unknown',
        req.originalUrl || req.url,
        `Breach attempt: Role [${userRole}] denied access to endpoint requiring [${allowedRoles.join(', ')}]`
      );

      return res.status(403).json({
        error: 'RBAC_ELEVATED_PRIVILEGE_REQUIRED',
        statusCode: 403,
        userRole: userRole,
        requiredRoles: allowedRoles,
        message: `Violent RBAC Rejection: User '${req.user.username}' with role '${userRole}' is strictly locked out of this administrative mutation endpoint. Required clearance: [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  JWT_SECRET
};
