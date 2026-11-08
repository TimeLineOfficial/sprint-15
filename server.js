/**
 * ApexTrack Enterprise — Feature Complete (Server Entrypoint)
 * Sprint 15 Capstone Architecture
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'node-backend-1';

// Global Middleware
app.use(cors());
app.use(express.json());

// Load Balancer Identification Header
app.use((req, res, next) => {
  res.setHeader('X-Cluster-Node', INSTANCE_ID);
  res.setHeader('X-Powered-By', 'ApexTrack Mesh Engine');
  next();
});

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Controllers
app.use('/api', apiRoutes);

// Catch-All SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local or Container Execution
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`[APEXTRACK CLUSTER NODE] Instance: ${INSTANCE_ID} | Port: ${PORT}`);
    console.log(`[RBAC GATEWAY] Secure perimeter initialized.`);
    console.log(`================================================================`);
  });
}

module.exports = app;
