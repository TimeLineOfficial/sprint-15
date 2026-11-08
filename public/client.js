/**
 * ApexTrack Enterprise — Client Controller
 * Sprint 15 Feature Complete: CRUD Execution, RBAC, and Telemetry
 */

(function () {
  'use strict';

  // --- Client State ---
  const state = {
    token: null,
    user: {
      username: 'admin_marcus',
      role: 'ADMIN',
      department: 'Fleet Operations',
      displayName: 'Marcus Vance'
    },
    shipments: [],
    telemetry: [],
    auditLogs: [],
    currentTab: 'tab-overview',
    activeNode: 'backend-1'
  };

  // Predefined Passwords for Demo Identities
  const CREDENTIALS = {
    'admin_marcus': 'admin123',
    'fleet_director': 'director2026',
    'dispatcher_elena': 'dispatch123',
    'operator_sarah': 'operator123',
    'auditor_guest': 'guest123'
  };

  // --- DOM Elements ---
  const el = {
    // Header
    selectRoleUser: document.getElementById('select-role-user'),
    identityRoleBadge: document.getElementById('identity-role-badge'),
    identityDisplayName: document.getElementById('identity-display-name'),
    identityDept: document.getElementById('identity-dept'),
    btnClusterPing: document.getElementById('btn-cluster-ping'),
    clusterNodeBadge: document.getElementById('cluster-node-badge'),
    activeTokenStatus: document.getElementById('active-token-status'),

    // Rejection Banner
    rejectionBanner: document.getElementById('violent-rejection-banner'),
    rejectionTitle: document.getElementById('rejection-title'),
    rejectionMessage: document.getElementById('rejection-message'),
    btnDismissRejection: document.getElementById('btn-dismiss-rejection'),

    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    viewPanels: document.querySelectorAll('.view-panel'),

    // Overview KPIs
    kpiTotalShipments: document.getElementById('kpi-total-shipments'),
    kpiInTransit: document.getElementById('kpi-in-transit'),
    kpiTonnage: document.getElementById('kpi-tonnage'),

    // Shipments CRUD
    inputSearch: document.getElementById('input-search-shipments'),
    selectStatusFilter: document.getElementById('select-status-filter'),
    selectClassFilter: document.getElementById('select-class-filter'),
    btnRefreshShipments: document.getElementById('btn-refresh-shipments'),
    btnOpenCreateModal: document.getElementById('btn-open-create-modal'),
    tbodyShipments: document.getElementById('tbody-shipments'),
    crudFeedbackConsole: document.getElementById('crud-feedback-console'),

    // Telemetry
    formIngestTelemetry: document.getElementById('form-ingest-telemetry'),
    tbodyTelemetry: document.getElementById('tbody-telemetry'),
    btnPurgeTelemetry: document.getElementById('btn-purge-telemetry'),

    // RBAC
    tokenBox: document.getElementById('token-box'),
    claimsBox: document.getElementById('claims-box'),
    btnSimulateForged: document.getElementById('btn-simulate-forged-token'),
    btnTriggerUnauth: document.getElementById('btn-trigger-unauthenticated'),

    // Audit
    tbodyAudit: document.getElementById('tbody-audit'),
    btnRefreshAudit: document.getElementById('btn-refresh-audit'),

    // Modals
    modalCreate: document.getElementById('modal-create-shipment'),
    formCreate: document.getElementById('form-create-shipment'),
    modalEdit: document.getElementById('modal-edit-shipment'),
    formEdit: document.getElementById('form-edit-shipment')
  };

  // --- Violent Rejection Handler ---
  function triggerViolentRejection(title, message, statusCode = 403) {
    el.rejectionTitle.textContent = `HTTP ${statusCode} SECURITY PERIMETER BREACH :: ${title}`;
    el.rejectionMessage.innerHTML = message;
    el.rejectionBanner.style.display = 'block';
    console.error(`[SECURITY PERIMETER BREACH] HTTP ${statusCode} — ${title}: ${message}`);
  }

  function dismissRejection() {
    el.rejectionBanner.style.display = 'none';
  }

  // --- API Helper ---
  async function apiCall(endpoint, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      
      // Observability header
      const node = res.headers.get('X-Cluster-Node');
      if (node) {
        state.activeNode = node;
        el.clusterNodeBadge.textContent = `Active Node: NGINX -> ${node} (least_conn)`;
      }

      if (!res.ok) {
        // Trigger violent rejection banner on 401 or 403
        if (res.status === 401 || res.status === 403) {
          triggerViolentRejection(data.error || 'ACCESS_DENIED', data.message || 'Unauthorized mutation.', res.status);
        }
      }

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn('[NETWORK / FALLBACK] Local API execution:', err.message);
      return { ok: false, status: 500, data: { message: err.message } };
    }
  }

  // --- Authentication ---
  async function authenticateAs(username) {
    const password = CREDENTIALS[username] || 'admin123';
    const res = await apiCall('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    });

    if (res.ok && res.data.token) {
      state.token = res.data.token;
      state.user = res.data.user;
      updateIdentityUI();
      dismissRejection();
      logConsole(`Authenticated successfully as ${state.user.displayName} [${state.user.role}]. Bearer token saved.`);
    } else {
      triggerViolentRejection('AUTHENTICATION_FAILED', `Could not authenticate as ${username}.`, 401);
    }
  }

  function updateIdentityUI() {
    el.identityRoleBadge.textContent = state.user.role;
    el.identityRoleBadge.className = `identity-role-badge badge-${state.user.role.toLowerCase()}`;
    el.identityDisplayName.textContent = state.user.displayName || state.user.username;
    el.identityDept.textContent = state.user.department || '';

    // Update Token display
    el.tokenBox.textContent = state.token || 'NO ACTIVE TOKEN';
    el.claimsBox.textContent = JSON.stringify(state.user, null, 2);

    // Re-render shipments table to update RBAC action button states
    renderShipmentsTable();
  }

  // --- CRUD: Read Shipments ---
  async function fetchShipments() {
    const q = new URLSearchParams();
    if (el.inputSearch.value.trim()) q.set('search', el.inputSearch.value.trim());
    if (el.selectStatusFilter.value) q.set('status', el.selectStatusFilter.value);
    if (el.selectClassFilter.value) q.set('classification', el.selectClassFilter.value);

    const res = await apiCall(`/api/shipments?${q.toString()}`);
    if (res.ok && res.data.data) {
      state.shipments = res.data.data;
      renderShipmentsTable();
      updateKPISummary();
    }
  }

  function renderShipmentsTable() {
    el.tbodyShipments.innerHTML = '';
    const isAdmin = state.user && state.user.role === 'ADMIN';
    const isViewer = state.user && state.user.role === 'VIEWER';

    if (state.shipments.length === 0) {
      el.tbodyShipments.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 2rem;">No shipments match active filter criteria.</td></tr>`;
      return;
    }

    state.shipments.forEach(s => {
      const tr = document.createElement('tr');
      const tempDiff = Math.abs(s.currentTempC - s.targetTempC);
      const isBreach = tempDiff > 3.0;

      tr.innerHTML = `
        <td><strong style="color: var(--text-main); font-family: var(--font-mono);">${s.trackingNumber}</strong></td>
        <td>
          <div style="font-weight: 600;">${s.origin}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">&rarr; ${s.destination}</div>
        </td>
        <td><span class="badge badge-info">${s.cargoClassification}</span></td>
        <td><span class="badge ${s.priority === 'CRITICAL' ? 'badge-danger' : (s.priority === 'HIGH' ? 'badge-warning' : 'badge-accent')}">${s.priority}</span></td>
        <td>
          <span style="font-family: var(--font-mono); ${isBreach ? 'color: var(--color-danger); font-weight: 700;' : ''}">
            ${s.currentTempC}°C (Target: ${s.targetTempC}°C)
          </span>
        </td>
        <td style="font-family: var(--font-mono);">${(s.weightKg).toLocaleString()} kg</td>
        <td><span class="status-badge status-${s.status}">${s.status}</span></td>
        <td><code style="color: var(--color-accent);">${s.assignedVehicle}</code></td>
        <td>
          <div class="action-btn-group">
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${s.id}" ${isViewer ? 'disabled' : ''} title="Edit shipment parameters">
              Edit
            </button>
            <button class="btn btn-danger btn-sm btn-delete ${!isAdmin ? 'btn-locked' : ''}" data-id="${s.id}" title="${isAdmin ? 'Permanently purge shipment (Admin only)' : 'Locked: Requires Admin clearance'}">
              ${isAdmin ? 'Purge' : '🔒 Purge'}
            </button>
          </div>
        </td>
      `;
      el.tbodyShipments.appendChild(tr);
    });

    // Attach Event Listeners to Buttons
    el.tbodyShipments.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    el.tbodyShipments.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteShipment(btn.dataset.id));
    });
  }

  // --- CRUD: Create Shipment ---
  async function handleCreateShipment(e) {
    e.preventDefault();
    const payload = {
      origin: document.getElementById('create-origin').value.trim(),
      destination: document.getElementById('create-destination').value.trim(),
      cargoClassification: document.getElementById('create-classification').value,
      priority: document.getElementById('create-priority').value,
      weightKg: parseFloat(document.getElementById('create-weight').value),
      targetTempC: parseFloat(document.getElementById('create-temp').value),
      assignedVehicle: document.getElementById('create-vehicle').value.trim(),
      notes: document.getElementById('create-notes').value.trim()
    };

    const res = await apiCall('/api/shipments', {
      method: 'POST',
      body: payload
    });

    if (res.ok) {
      logConsole(`HTTP 201 CREATED :: Committed shipment [${res.data.data.trackingNumber}] to database.`);
      closeModals();
      el.formCreate.reset();
      fetchShipments();
      fetchAuditLogs();
    }
  }

  // --- CRUD: Update Shipment ---
  function openEditModal(id) {
    const shipment = state.shipments.find(s => s.id === id);
    if (!shipment) return;

    document.getElementById('edit-id').value = shipment.id;
    document.getElementById('edit-origin').value = shipment.origin;
    document.getElementById('edit-destination').value = shipment.destination;
    document.getElementById('edit-status').value = shipment.status;
    document.getElementById('edit-priority').value = shipment.priority;
    document.getElementById('edit-notes').value = shipment.notes || '';

    el.modalEdit.style.display = 'flex';
  }

  async function handleEditShipment(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const updates = {
      origin: document.getElementById('edit-origin').value.trim(),
      destination: document.getElementById('edit-destination').value.trim(),
      status: document.getElementById('edit-status').value,
      priority: document.getElementById('edit-priority').value,
      notes: document.getElementById('edit-notes').value.trim()
    };

    const res = await apiCall(`/api/shipments/${id}`, {
      method: 'PUT',
      body: updates
    });

    if (res.ok) {
      logConsole(`HTTP 200 OK :: Updated shipment [${res.data.data.trackingNumber}].`);
      closeModals();
      fetchShipments();
      fetchAuditLogs();
    }
  }

  // --- CRUD: Delete Shipment (RBAC Admin Only) ---
  async function handleDeleteShipment(id) {
    const shipment = state.shipments.find(s => s.id === id);
    const tracking = shipment ? shipment.trackingNumber : id;

    if (!confirm(`Are you sure you want to permanently purge shipment [${tracking}]? This action is audited.`)) {
      return;
    }

    const res = await apiCall(`/api/shipments/${id}`, {
      method: 'DELETE',
      body: { reason: 'User initiated administrative decommission' }
    });

    if (res.ok) {
      logConsole(`HTTP 200 DELETED :: Successfully purged shipment [${tracking}] from database.`);
      fetchShipments();
      fetchAuditLogs();
    }
  }

  // --- Telemetry Operations ---
  async function fetchTelemetry() {
    const res = await apiCall('/api/telemetry?limit=25');
    if (res.ok && res.data.data) {
      state.telemetry = res.data.data;
      renderTelemetryTable();
    }
  }

  function renderTelemetryTable() {
    el.tbodyTelemetry.innerHTML = '';
    state.telemetry.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--color-accent); font-family: var(--font-mono);">${t.vehicleId}</strong></td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem;">${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}</td>
        <td style="font-family: var(--font-mono);">${t.speedKmh} km/h</td>
        <td style="font-family: var(--font-mono);">${t.cargoTempC}°C</td>
        <td><span class="badge badge-prod">${t.batteryPercent}%</span></td>
        <td><span class="badge badge-prod">${t.healthStatus}</span></td>
      `;
      el.tbodyTelemetry.appendChild(tr);
    });
  }

  async function handleIngestTelemetry(e) {
    e.preventDefault();
    const reading = {
      vehicleId: document.getElementById('tel-vehicle').value.trim(),
      speedKmh: parseFloat(document.getElementById('tel-speed').value),
      latitude: parseFloat(document.getElementById('tel-lat').value),
      longitude: parseFloat(document.getElementById('tel-lng').value),
      cargoTempC: parseFloat(document.getElementById('tel-temp').value),
      batteryPercent: parseInt(document.getElementById('tel-battery').value, 10),
      healthStatus: 'OPTIMAL'
    };

    const res = await apiCall('/api/telemetry/ingest', {
      method: 'POST',
      body: reading
    });

    if (res.ok) {
      logConsole(`HTTP 202 ACCEPTED :: Ingested sensor frame for ${reading.vehicleId}.`);
      fetchTelemetry();
      fetchShipments();
    }
  }

  async function handlePurgeTelemetry() {
    if (!confirm('Purge all buffered telemetry readings? (Requires ADMIN clearance)')) return;

    const res = await apiCall('/api/telemetry/buffer', {
      method: 'DELETE'
    });

    if (res.ok) {
      logConsole(`HTTP 200 OK :: Purged ${res.data.purgedCount} telemetry frames from buffer.`);
      fetchTelemetry();
      fetchAuditLogs();
    }
  }

  // --- Audit Logs ---
  async function fetchAuditLogs() {
    // Only attempt if admin
    if (state.user && state.user.role !== 'ADMIN') {
      el.tbodyAudit.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger); padding: 2rem;">🔒 RBAC RESTRICTION: Immutable Audit Ledger requires ADMIN role elevation.</td></tr>`;
      return;
    }

    const res = await apiCall('/api/audit/logs?limit=30');
    if (res.ok && res.data.data) {
      state.auditLogs = res.data.data;
      renderAuditTable();
    }
  }

  function renderAuditTable() {
    el.tbodyAudit.innerHTML = '';
    state.auditLogs.forEach(log => {
      const tr = document.createElement('tr');
      const isBreach = log.action.includes('DENIED') || log.action.includes('BREACH') || log.action.includes('FAILED');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">${new Date(log.timestamp).toLocaleTimeString()}</td>
        <td><span class="badge ${isBreach ? 'badge-danger' : 'badge-info'}">${log.action}</span></td>
        <td><strong style="color: var(--text-main); font-family: var(--font-mono);">${log.actor}</strong></td>
        <td><code style="color: var(--color-accent);">${log.target}</code></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${log.details}</td>
      `;
      el.tbodyAudit.appendChild(tr);
    });
  }

  // --- KPI Updates ---
  async function updateKPISummary() {
    const res = await apiCall('/api/analytics/summary');
    if (res.ok && res.data.data) {
      const s = res.data.data;
      el.kpiTotalShipments.textContent = s.totalShipments;
      el.kpiInTransit.textContent = s.inTransit;
      el.kpiTonnage.textContent = `${s.totalTonnageTons} t`;
    }
  }

  // --- Navigation & Modals ---
  function switchTab(tabId) {
    el.navTabs.forEach(t => {
      if (t.dataset.tab === tabId) t.classList.add('active');
      else t.classList.remove('active');
    });

    el.viewPanels.forEach(p => {
      if (p.id === tabId) p.classList.add('active');
      else p.classList.remove('active');
    });

    state.currentTab = tabId;

    if (tabId === 'tab-shipments') fetchShipments();
    if (tabId === 'tab-telemetry') fetchTelemetry();
    if (tabId === 'tab-audit') fetchAuditLogs();
    if (tabId === 'tab-overview') updateKPISummary();
  }

  function closeModals() {
    el.modalCreate.style.display = 'none';
    el.modalEdit.style.display = 'none';
  }

  function logConsole(msg) {
    if (el.crudFeedbackConsole) {
      el.crudFeedbackConsole.innerHTML = `<span class="console-prompt">&gt; [${new Date().toLocaleTimeString()}]</span> ${msg}`;
    }
  }

  // --- Event Bindings ---
  function initEvents() {
    // Navigation
    el.navTabs.forEach(t => {
      t.addEventListener('click', () => switchTab(t.dataset.tab));
    });

    // Identity Switcher
    el.selectRoleUser.addEventListener('change', (e) => {
      authenticateAs(e.target.value);
    });

    // Rejection Banner Dismissal
    el.btnDismissRejection.addEventListener('click', dismissRejection);

    // Cluster Ping
    el.btnClusterPing.addEventListener('click', async () => {
      const res = await apiCall('/api/health');
      if (res.ok) {
        logConsole(`NGINX Ping: Routed to cluster node [${res.data.clusterNode}] :: Status: ${res.data.status}`);
      }
    });

    // Shipments Filters
    el.inputSearch.addEventListener('input', fetchShipments);
    el.selectStatusFilter.addEventListener('change', fetchShipments);
    el.selectClassFilter.addEventListener('change', fetchShipments);
    el.btnRefreshShipments.addEventListener('click', fetchShipments);

    // Modals
    el.btnOpenCreateModal.addEventListener('click', () => {
      if (state.user && state.user.role === 'VIEWER') {
        triggerViolentRejection('RBAC_FORBIDDEN', 'Viewers cannot create new shipments.', 403);
        return;
      }
      el.modalCreate.style.display = 'flex';
    });

    document.querySelectorAll('.btn-close-modal, .btn-cancel-modal').forEach(btn => {
      btn.addEventListener('click', closeModals);
    });

    el.formCreate.addEventListener('submit', handleCreateShipment);
    el.formEdit.addEventListener('submit', handleEditShipment);

    // Telemetry
    el.formIngestTelemetry.addEventListener('submit', handleIngestTelemetry);
    el.btnPurgeTelemetry.addEventListener('click', handlePurgeTelemetry);

    // Audit
    el.btnRefreshAudit.addEventListener('click', fetchAuditLogs);

    // RBAC Simulation Buttons
    el.btnSimulateForged.addEventListener('click', () => {
      state.token = 'forged.tampered.signature.segment';
      updateIdentityUI();
      triggerViolentRejection(
        'FORBIDDEN_INVALID_SIGNATURE',
        'Cryptographic token verification failed: JWT signature does not match production HMAC secret.',
        403
      );
    });

    el.btnTriggerUnauth.addEventListener('click', () => {
      state.token = null;
      updateIdentityUI();
      triggerViolentRejection(
        'UNAUTHORIZED_PERIMETER_BREACH',
        'Route guard violently rejected request: No active Authorization Bearer header supplied.',
        401
      );
    });
  }

  // --- Initialization ---
  async function init() {
    initEvents();
    await authenticateAs('admin_marcus');
    await fetchShipments();
    await fetchTelemetry();
    await updateKPISummary();
    console.log('[APEXTRACK] Enterprise Feature Complete Client Initialized.');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
