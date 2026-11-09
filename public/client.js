/**
 * ApexTrack Enterprise — Client Controller
 * Sprint 15 Feature Complete: High-Performance UI/UX Engine
 */

(function () {
  'use strict';

  // --- Core Application State ---
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
    viewMode: 'cards', // 'cards' or 'table'
    activeShipment: null,
    backendTrafficIndex: 0
  };

  // Demo User Passwords
  const CREDENTIALS = {
    'admin_marcus': 'admin123',
    'fleet_director': 'director2026',
    'dispatcher_elena': 'dispatch123',
    'operator_sarah': 'operator123',
    'auditor_guest': 'guest123'
  };

  // User Avatars Map
  const AVATARS = {
    'admin_marcus': { initials: 'MV', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
    'fleet_director': { initials: 'DS', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    'dispatcher_elena': { initials: 'ER', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    'operator_sarah': { initials: 'SC', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    'auditor_guest': { initials: 'GA', color: 'linear-gradient(135deg, #64748b, #475569)' }
  };

  // DOM Elements Cache
  const el = {
    // Header & Identity
    selectRoleUser: document.getElementById('select-role-user'),
    userAvatarCircle: document.getElementById('user-avatar-circle'),
    userDisplayName: document.getElementById('user-display-name'),
    userRolePill: document.getElementById('user-role-pill'),
    userDept: document.getElementById('user-dept'),
    btnClusterPing: document.getElementById('btn-cluster-ping'),
    headerNodeIndicator: document.getElementById('header-node-indicator'),
    globalSearchInput: document.getElementById('global-search-input'),

    // Security Rejection Banner
    rejectionBanner: document.getElementById('violent-rejection-banner'),
    rejectionCode: document.getElementById('rejection-code'),
    rejectionDetail: document.getElementById('rejection-detail'),
    btnDismissRejection: document.getElementById('btn-dismiss-rejection'),

    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    viewPanels: document.querySelectorAll('.view-panel'),
    navShipmentsCount: document.getElementById('nav-shipments-count'),

    // KPIs
    kpiTotalShipments: document.getElementById('kpi-total-shipments'),
    kpiInTransit: document.getElementById('kpi-in-transit'),
    kpiTonnage: document.getElementById('kpi-tonnage'),
    kpiClusterNodes: document.getElementById('kpi-cluster-nodes'),

    // Shipments View Controls
    btnViewCards: document.getElementById('btn-view-cards'),
    btnViewTable: document.getElementById('btn-view-table'),
    shipmentsCardsView: document.getElementById('shipments-cards-view'),
    shipmentsTableView: document.getElementById('shipments-table-view'),
    inputSearchShipments: document.getElementById('input-search-shipments'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    statusPillsContainer: document.getElementById('status-pills-container'),
    selectClassFilter: document.getElementById('select-class-filter'),
    btnRefreshShipments: document.getElementById('btn-refresh-shipments'),
    btnOpenCreateModal: document.getElementById('btn-open-create-modal'),
    btnHeroDispatch: document.getElementById('btn-hero-dispatch'),
    btnHeroSimulateTelemetry: document.getElementById('btn-hero-simulate-telemetry'),
    tbodyShipments: document.getElementById('tbody-shipments'),
    crudFeedbackConsole: document.getElementById('crud-feedback-console'),

    // Telemetry Gauges & Stream
    gaugeSpeedVal: document.getElementById('gauge-speed-val'),
    speedGaugeRing: document.getElementById('speed-gauge-ring'),
    gaugeTempVal: document.getElementById('gauge-temp-val'),
    tempGaugeRing: document.getElementById('temp-gauge-ring'),
    tempStatusBadge: document.getElementById('temp-status-badge'),
    gaugeBatteryVal: document.getElementById('gauge-battery-val'),
    batteryGaugeRing: document.getElementById('battery-gauge-ring'),
    formIngestTelemetry: document.getElementById('form-ingest-telemetry'),
    tbodyTelemetry: document.getElementById('tbody-telemetry'),
    btnPurgeTelemetry: document.getElementById('btn-purge-telemetry'),
    presetPharmaOptimal: document.getElementById('preset-pharma-optimal'),
    presetPharmaBreach: document.getElementById('preset-pharma-breach'),
    presetExpressRun: document.getElementById('preset-express-run'),

    // RBAC Security
    tokenBox: document.getElementById('token-box'),
    claimsBox: document.getElementById('claims-box'),
    rbacActiveRoleChip: document.getElementById('rbac-active-role-chip'),
    btnSimulateForged: document.getElementById('btn-simulate-forged-token'),
    btnTriggerUnauth: document.getElementById('btn-trigger-unauthenticated'),

    // Cluster
    btnSimulateTraffic: document.getElementById('btn-simulate-traffic'),

    // Audit
    tbodyAudit: document.getElementById('tbody-audit'),
    btnRefreshAudit: document.getElementById('btn-refresh-audit'),

    // Modals & Drawer
    modalCreate: document.getElementById('modal-create-shipment'),
    formCreate: document.getElementById('form-create-shipment'),
    modalEdit: document.getElementById('modal-edit-shipment'),
    formEdit: document.getElementById('form-edit-shipment'),
    shipmentDrawer: document.getElementById('shipment-drawer'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    btnDrawerQuickEdit: document.getElementById('btn-drawer-quick-edit'),
    btnDrawerQuickDelete: document.getElementById('btn-drawer-quick-delete'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // --- Toast Notification Engine ---
  function showToast(message, type = 'info') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        ${iconSvg}
        <span>${message}</span>
      </div>
    `;

    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Violent Rejection Handler ---
  function triggerViolentRejection(title, message, statusCode = 403) {
    el.rejectionCode.textContent = `HTTP ${statusCode} FORBIDDEN`;
    el.rejectionDetail.innerHTML = `<strong>${title}:</strong> ${message}`;
    el.rejectionBanner.style.display = 'block';
    showToast(`Security Perimeter Breach: ${title}`, 'danger');
    console.error(`[SECURITY PERIMETER BREACH] HTTP ${statusCode} — ${title}: ${message}`);
  }

  function dismissRejection() {
    el.rejectionBanner.style.display = 'none';
  }

  // --- API Gateway Helper ---
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
      
      const node = res.headers.get('X-Cluster-Node');
      if (node && el.headerNodeIndicator) {
        el.headerNodeIndicator.textContent = `NGINX -> ${node}`;
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          triggerViolentRejection(data.error || 'UNAUTHORIZED_MUTATION', data.message || 'Access Denied.', res.status);
        }
      }

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn('[NETWORK FALLBACK] Executing via in-memory local mesh:', err.message);
      return { ok: false, status: 500, data: { message: err.message } };
    }
  }

  // --- Authentication & Identity Management ---
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
      showToast(`Authenticated as ${state.user.displayName}`, 'success');
      logConsole(`Session established for [${state.user.username}]. Role: ${state.user.role}`);
    } else {
      triggerViolentRejection('AUTH_FAILURE', `Could not authenticate credentials for '${username}'.`, 401);
    }
  }

  function updateIdentityUI() {
    const u = state.user;
    el.userDisplayName.textContent = u.displayName || u.username;
    el.userRolePill.textContent = u.role;
    el.userRolePill.className = `role-pill role-${u.role.toLowerCase()}`;
    el.userDept.textContent = u.department || 'Logistics Ops';

    // Avatar Circle
    const av = AVATARS[u.username] || { initials: 'U', color: 'var(--color-primary)' };
    el.userAvatarCircle.textContent = av.initials;
    el.userAvatarCircle.style.background = av.color;

    // RBAC Tab Updates
    if (el.tokenBox) el.tokenBox.textContent = state.token || 'NO ACTIVE BEARER TOKEN';
    if (el.claimsBox) el.claimsBox.textContent = JSON.stringify(state.user, null, 2);
    if (el.rbacActiveRoleChip) el.rbacActiveRoleChip.textContent = `CLEARANCE LEVEL: ${u.role}`;

    // Re-render UI components to enforce role button locks
    renderShipments();
  }

  // --- CRUD: Read Shipments ---
  async function fetchShipments() {
    const params = new URLSearchParams();
    const searchVal = el.inputSearchShipments.value.trim() || el.globalSearchInput.value.trim();
    if (searchVal) params.set('search', searchVal);

    const activeStatusPill = el.statusPillsContainer.querySelector('.status-pill.active');
    if (activeStatusPill && activeStatusPill.dataset.status) {
      params.set('status', activeStatusPill.dataset.status);
    }

    if (el.selectClassFilter.value) {
      params.set('classification', el.selectClassFilter.value);
    }

    const res = await apiCall(`/api/shipments?${params.toString()}`);
    if (res.ok && res.data.data) {
      state.shipments = res.data.data;
      el.navShipmentsCount.textContent = state.shipments.length;
      renderShipments();
      updateKPISummary();
    }
  }

  function renderShipments() {
    if (state.viewMode === 'cards') {
      renderShipmentsCards();
      el.shipmentsCardsView.style.display = 'grid';
      el.shipmentsTableView.style.display = 'none';
    } else {
      renderShipmentsTable();
      el.shipmentsCardsView.style.display = 'none';
      el.shipmentsTableView.style.display = 'block';
    }
  }

  // --- VIEW 1: Render Visual Cards Grid ---
  function renderShipmentsCards() {
    el.shipmentsCardsView.innerHTML = '';
    const isAdmin = state.user && state.user.role === 'ADMIN';

    if (state.shipments.length === 0) {
      el.shipmentsCardsView.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-dim); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
          <h4 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.25rem;">No matching freight manifests found</h4>
          <p style="font-size: 0.85rem;">Adjust search filters or click "Dispatch Shipment" to create a new record.</p>
        </div>
      `;
      return;
    }

    state.shipments.forEach(s => {
      const card = document.createElement('div');
      card.className = `shipment-card card-status-${s.status}`;
      
      const tempDiff = Math.abs(s.currentTempC - s.targetTempC);
      const isBreach = tempDiff > 3.0;

      // Calculate Visual Route Progress
      let progressPct = 15;
      let progressStatus = 'Departed Hub';
      if (s.status === 'IN_TRANSIT') { progressPct = 55; progressStatus = 'En Route Highway Corridor'; }
      else if (s.status === 'HELD_CUSTOMS') { progressPct = 78; progressStatus = 'Port Customs Hold'; }
      else if (s.status === 'DELIVERED') { progressPct = 100; progressStatus = 'Delivered to Receiving'; }

      card.innerHTML = `
        <div class="sc-header">
          <div>
            <div class="sc-tracking-num">${s.trackingNumber}</div>
            <div class="sc-classification">${s.cargoClassification}</div>
          </div>
          <span class="status-chip status-chip-${s.status}">
            <span class="chip-dot"></span> ${s.status}
          </span>
        </div>

        <div class="sc-route-timeline">
          <div class="route-hub-node">
            <span class="hub-city">${s.origin.split(',')[0]}</span>
            <span class="hub-meta">Departure Hub</span>
          </div>

          <div class="route-track-line">
            <div class="route-progress-fill" style="width: ${progressPct}%;"></div>
            <div class="route-carrier-icon" style="left: ${progressPct}%;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
          </div>

          <div class="route-hub-node route-hub-dest">
            <span class="hub-city">${s.destination.split(',')[0]}</span>
            <span class="hub-meta">Destination Terminal</span>
          </div>
        </div>

        <div class="sc-specs-row">
          <div class="sc-spec-item">
            <span class="sc-spec-label">Payload</span>
            <span class="sc-spec-val">${(s.weightKg).toLocaleString()} kg</span>
          </div>
          <div class="sc-spec-item">
            <span class="sc-spec-label">Target Temp</span>
            <span class="sc-spec-val text-cyan">${s.targetTempC}°C</span>
          </div>
          <div class="sc-spec-item">
            <span class="sc-spec-label">Live Sensor</span>
            <span class="sc-spec-val" style="${isBreach ? 'color: var(--color-danger); font-weight:800;' : 'color: var(--color-success);'}">
              ${s.currentTempC}°C ${isBreach ? '⚠️' : '✓'}
            </span>
          </div>
        </div>

        <div class="sc-footer">
          <div style="font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono);">
            Unit: <strong style="color: #fff;">${s.assignedVehicle}</strong>
          </div>
          <div class="sc-actions-group">
            <button class="btn btn-secondary btn-sm btn-inspect-card" data-id="${s.id}" title="Deep telemetry inspection">
              Inspect
            </button>
            <button class="btn btn-danger btn-sm btn-delete-card ${!isAdmin ? 'btn-locked' : ''}" data-id="${s.id}" title="${isAdmin ? 'Purge shipment' : 'Locked: Requires Admin clearance'}">
              ${isAdmin ? 'Purge' : '🔒 Purge'}
            </button>
          </div>
        </div>
      `;

      // Click card to open inspection drawer
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-card')) return;
        openShipmentDrawer(s.id);
      });

      // Purge Button Action
      const btnDelete = card.querySelector('.btn-delete-card');
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteShipment(s.id);
      });

      el.shipmentsCardsView.appendChild(card);
    });
  }

  // --- VIEW 2: Render Enterprise Data Table ---
  function renderShipmentsTable() {
    el.tbodyShipments.innerHTML = '';
    const isAdmin = state.user && state.user.role === 'ADMIN';

    if (state.shipments.length === 0) {
      el.tbodyShipments.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 2.5rem;">No shipments match active filter criteria.</td></tr>`;
      return;
    }

    state.shipments.forEach(s => {
      const tr = document.createElement('tr');
      const tempDiff = Math.abs(s.currentTempC - s.targetTempC);
      const isBreach = tempDiff > 3.0;

      tr.innerHTML = `
        <td><strong style="color: #fff; font-family: var(--font-mono); font-size: 0.9rem;">${s.trackingNumber}</strong></td>
        <td>
          <div style="font-weight: 600; color: #fff;">${s.origin}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim);">&rarr; ${s.destination}</div>
        </td>
        <td><span class="badge badge-prod">${s.cargoClassification}</span></td>
        <td><span class="badge ${s.priority === 'CRITICAL' ? 'badge-danger' : (s.priority === 'HIGH' ? 'badge-warning' : 'badge-accent')}">${s.priority}</span></td>
        <td>
          <span style="font-family: var(--font-mono); ${isBreach ? 'color: var(--color-danger); font-weight:700;' : 'color: var(--color-cyan);'}">
            ${s.currentTempC}°C (Target: ${s.targetTempC}°C)
          </span>
        </td>
        <td style="font-family: var(--font-mono);">${(s.weightKg).toLocaleString()} kg</td>
        <td><span class="status-chip status-chip-${s.status}"><span class="chip-dot"></span> ${s.status}</span></td>
        <td><code style="color: var(--color-cyan); font-weight:600;">${s.assignedVehicle}</code></td>
        <td style="text-align: right;">
          <div class="sc-actions-group" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm btn-inspect-row" data-id="${s.id}">Inspect</button>
            <button class="btn btn-danger btn-sm btn-delete-row ${!isAdmin ? 'btn-locked' : ''}" data-id="${s.id}">
              ${isAdmin ? 'Purge' : '🔒 Purge'}
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-inspect-row').addEventListener('click', () => openShipmentDrawer(s.id));
      tr.querySelector('.btn-delete-row').addEventListener('click', () => handleDeleteShipment(s.id));
      el.tbodyShipments.appendChild(tr);
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
      showToast(`Shipment [${res.data.data.trackingNumber}] Dispatched`, 'success');
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
      showToast(`Shipment [${res.data.data.trackingNumber}] Updated`, 'success');
      logConsole(`HTTP 200 OK :: Updated shipment [${res.data.data.trackingNumber}].`);
      closeModals();
      fetchShipments();
      fetchAuditLogs();
      if (state.activeShipment && state.activeShipment.id === id) {
        openShipmentDrawer(id);
      }
    }
  }

  // --- CRUD: Delete Shipment (RBAC Guarded) ---
  async function handleDeleteShipment(id) {
    const shipment = state.shipments.find(s => s.id === id);
    const tracking = shipment ? shipment.trackingNumber : id;

    // RBAC Pre-Check: If non-admin attempts delete, immediately trigger violent rejection
    if (state.user && state.user.role !== 'ADMIN') {
      triggerViolentRejection(
        'RBAC_ELEVATED_PRIVILEGE_REQUIRED',
        `User '${state.user.username}' with role '${state.user.role}' is strictly locked out of shipment purge mutations. Clearance required: [ADMIN].`,
        403
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently purge shipment [${tracking}] from the central fleet registry?`)) {
      return;
    }

    const res = await apiCall(`/api/shipments/${id}`, {
      method: 'DELETE',
      body: { reason: 'User initiated administrative decommission' }
    });

    if (res.ok) {
      showToast(`Shipment [${tracking}] Purged from Registry`, 'danger');
      logConsole(`HTTP 200 DELETED :: Successfully purged shipment [${tracking}].`);
      closeDrawer();
      fetchShipments();
      fetchAuditLogs();
    }
  }

  // --- Deep Inspection Slide-Over Drawer ---
  function openShipmentDrawer(id) {
    const shipment = state.shipments.find(s => s.id === id);
    if (!shipment) return;
    state.activeShipment = shipment;

    document.getElementById('drawer-tracking-badge').textContent = shipment.trackingNumber;
    document.getElementById('drawer-route-title').textContent = `${shipment.origin.split(',')[0]} → ${shipment.destination.split(',')[0]}`;
    document.getElementById('drawer-cargo').textContent = shipment.cargoClassification;
    document.getElementById('drawer-weight').textContent = `${(shipment.weightKg).toLocaleString()} kg`;
    document.getElementById('drawer-target-temp').textContent = `${shipment.targetTempC} °C`;
    document.getElementById('drawer-current-temp').textContent = `${shipment.currentTempC} °C`;
    document.getElementById('drawer-vehicle').textContent = shipment.assignedVehicle;
    document.getElementById('drawer-dispatcher').textContent = shipment.dispatcher || 'system';
    document.getElementById('drawer-notes').textContent = shipment.notes || 'No special handling instructions.';

    // Update Progress Timeline Stepper
    const steps = ['dispatched', 'transit', 'customs', 'delivered'];
    steps.forEach(st => {
      const stepEl = document.getElementById(`step-${st}`);
      if (stepEl) stepEl.className = 'timeline-step';
    });

    const lines = ['1', '2', '3'];
    lines.forEach(l => {
      const lineEl = document.getElementById(`line-${l}`);
      if (lineEl) lineEl.style.background = 'rgba(255,255,255,0.1)';
    });

    if (shipment.status === 'DISPATCHED') {
      document.getElementById('step-dispatched').classList.add('step-done');
    } else if (shipment.status === 'IN_TRANSIT') {
      document.getElementById('step-dispatched').classList.add('step-done');
      document.getElementById('step-transit').classList.add('step-active');
      document.getElementById('line-1').style.background = 'var(--color-primary)';
    } else if (shipment.status === 'HELD_CUSTOMS') {
      document.getElementById('step-dispatched').classList.add('step-done');
      document.getElementById('step-transit').classList.add('step-done');
      document.getElementById('step-customs').classList.add('step-active');
      document.getElementById('line-1').style.background = 'var(--color-primary)';
      document.getElementById('line-2').style.background = 'var(--color-warning)';
    } else if (shipment.status === 'DELIVERED') {
      document.getElementById('step-dispatched').classList.add('step-done');
      document.getElementById('step-transit').classList.add('step-done');
      document.getElementById('step-customs').classList.add('step-done');
      document.getElementById('step-delivered').classList.add('step-done');
      document.getElementById('line-1').style.background = 'var(--color-success)';
      document.getElementById('line-2').style.background = 'var(--color-success)';
      document.getElementById('line-3').style.background = 'var(--color-success)';
    }

    el.shipmentDrawer.style.display = 'flex';
  }

  function closeDrawer() {
    el.shipmentDrawer.style.display = 'none';
    state.activeShipment = null;
  }

  // --- Telemetry Operations ---
  async function fetchTelemetry() {
    const res = await apiCall('/api/telemetry?limit=25');
    if (res.ok && res.data.data) {
      state.telemetry = res.data.data;
      renderTelemetryTable();
      updateTelemetryGauges();
    }
  }

  function updateTelemetryGauges() {
    if (state.telemetry.length === 0) return;
    const latest = state.telemetry[0];

    // Speedometer (0-120 km/h) -> 408 is perimeter of 65px radius circle
    const speed = latest.speedKmh || 0;
    const speedPct = Math.min(speed / 140, 1);
    const speedOffset = 408 - (408 * speedPct);
    el.gaugeSpeedVal.textContent = speed.toFixed(1);
    el.speedGaugeRing.style.strokeDashoffset = speedOffset;

    // Temperature (-30°C to +30°C)
    const temp = latest.cargoTempC || 0;
    const tempDiff = Math.abs(temp - (-20.0));
    const isBreach = tempDiff > 3.0;
    el.gaugeTempVal.textContent = temp.toFixed(1);
    
    if (isBreach) {
      el.tempStatusBadge.textContent = 'BREACH ALERT';
      el.tempStatusBadge.className = 'badge badge-danger pulse';
      el.tempGaugeRing.className = 'gauge-active-ring stroke-danger';
    } else {
      el.tempStatusBadge.textContent = 'OPTIMAL';
      el.tempStatusBadge.className = 'badge badge-prod';
      el.tempGaugeRing.className = 'gauge-active-ring stroke-cyan';
    }

    // Battery (0-100%)
    const batt = latest.batteryPercent || 88;
    const battOffset = 408 - (408 * (batt / 100));
    el.gaugeBatteryVal.textContent = `${batt}%`;
    el.batteryGaugeRing.style.strokeDashoffset = battOffset;
  }

  function renderTelemetryTable() {
    el.tbodyTelemetry.innerHTML = '';
    state.telemetry.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--color-cyan); font-family: var(--font-mono);">${t.vehicleId}</strong></td>
        <td style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}</td>
        <td style="font-family: var(--font-mono); font-weight:600;">${t.speedKmh} km/h</td>
        <td style="font-family: var(--font-mono); color: ${Math.abs(t.cargoTempC - (-20)) > 3 ? 'var(--color-danger)' : 'var(--color-cyan)'}; font-weight:700;">
          ${t.cargoTempC}°C
        </td>
        <td><span class="badge badge-prod">${t.batteryPercent}%</span></td>
        <td><span class="status-chip status-chip-DELIVERED"><span class="chip-dot"></span> ${t.healthStatus}</span></td>
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
      showToast(`Sensor frame ingested for [${reading.vehicleId}]`, 'info');
      logConsole(`HTTP 202 ACCEPTED :: Ingested telemetry frame for ${reading.vehicleId}.`);
      fetchTelemetry();
      fetchShipments();
    }
  }

  async function handlePurgeTelemetry() {
    if (state.user && state.user.role !== 'ADMIN') {
      triggerViolentRejection(
        'RBAC_ELEVATED_PRIVILEGE_REQUIRED',
        `User '${state.user.username}' is locked out of buffer purge. Clearance required: [ADMIN].`,
        403
      );
      return;
    }

    if (!confirm('Purge all buffered telemetry readings from active cache?')) return;

    const res = await apiCall('/api/telemetry/buffer', {
      method: 'DELETE'
    });

    if (res.ok) {
      showToast(`Purged ${res.data.purgedCount} telemetry frames`, 'danger');
      fetchTelemetry();
      fetchAuditLogs();
    }
  }

  // --- Audit Ledger Operations ---
  async function fetchAuditLogs() {
    if (state.user && state.user.role !== 'ADMIN') {
      el.tbodyAudit.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger); padding: 2.5rem;">🔒 RBAC RESTRICTION: Immutable Audit Ledger requires ADMIN role elevation.</td></tr>`;
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
        <td><span class="badge ${isBreach ? 'badge-danger pulse' : 'badge-prod'}">${log.action}</span></td>
        <td><strong style="color: #fff; font-family: var(--font-mono);">${log.actor}</strong></td>
        <td><code style="color: var(--color-cyan);">${log.target}</code></td>
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
      el.kpiTonnage.innerHTML = `${s.totalTonnageTons} <span class="stat-unit">tons</span>`;
    }
  }

  // --- Interactive Traffic Simulation (Phase 3 NGINX Load Balancing) ---
  function simulateClusterTraffic() {
    state.backendTrafficIndex = (state.backendTrafficIndex % 3) + 1;
    const targetNodeId = `node-box-${state.backendTrafficIndex}`;
    const connEl = document.getElementById(`conn-count-${state.backendTrafficIndex}`);

    if (connEl) {
      const current = parseInt(connEl.textContent, 10) || 0;
      connEl.textContent = current + 1;
    }

    // Flash backend card
    const targetCard = document.getElementById(targetNodeId);
    if (targetCard) {
      targetCard.style.borderColor = 'var(--color-cyan)';
      targetCard.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
      setTimeout(() => {
        targetCard.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        targetCard.style.boxShadow = 'none';
      }, 600);
    }

    showToast(`NGINX balanced packet -> backend-${state.backendTrafficIndex} (:300${state.backendTrafficIndex}) via least_conn`, 'success');
  }

  // --- Navigation & Modals ---
  function switchTab(tabId) {
    el.navLinks.forEach(t => {
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
      el.crudFeedbackConsole.querySelector('.terminal-text').textContent = msg;
    }
  }

  // --- Event Bindings ---
  function initEvents() {
    // Navigation
    el.navLinks.forEach(l => {
      l.addEventListener('click', () => switchTab(l.dataset.tab));
    });

    // Identity Switcher
    el.selectRoleUser.addEventListener('change', (e) => {
      authenticateAs(e.target.value);
    });

    // Dismiss Rejection
    el.btnDismissRejection.addEventListener('click', dismissRejection);

    // Cluster Ping
    el.btnClusterPing.addEventListener('click', async () => {
      const res = await apiCall('/api/health');
      if (res.ok) {
        showToast(`Pinged ${res.data.clusterNode} (Uptime: ${res.data.uptimeSeconds}s)`, 'info');
      }
    });

    // View Mode Toggle (Cards vs Table)
    el.btnViewCards.addEventListener('click', () => {
      state.viewMode = 'cards';
      el.btnViewCards.classList.add('active');
      el.btnViewTable.classList.remove('active');
      renderShipments();
    });

    el.btnViewTable.addEventListener('click', () => {
      state.viewMode = 'table';
      el.btnViewTable.classList.add('active');
      el.btnViewCards.classList.remove('active');
      renderShipments();
    });

    // Search & Filters
    el.inputSearchShipments.addEventListener('input', () => {
      if (el.inputSearchShipments.value) el.btnClearSearch.style.display = 'block';
      else el.btnClearSearch.style.display = 'none';
      fetchShipments();
    });

    el.btnClearSearch.addEventListener('click', () => {
      el.inputSearchShipments.value = '';
      el.btnClearSearch.style.display = 'none';
      fetchShipments();
    });

    el.globalSearchInput.addEventListener('input', () => {
      switchTab('tab-shipments');
      el.inputSearchShipments.value = el.globalSearchInput.value;
      fetchShipments();
    });

    // Status Filter Pills
    el.statusPillsContainer.querySelectorAll('.status-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        el.statusPillsContainer.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        fetchShipments();
      });
    });

    el.selectClassFilter.addEventListener('change', fetchShipments);
    el.btnRefreshShipments.addEventListener('click', fetchShipments);

    // Modals
    const openCreate = () => {
      if (state.user && state.user.role === 'VIEWER') {
        triggerViolentRejection('RBAC_FORBIDDEN', 'Viewers cannot create new shipments.', 403);
        return;
      }
      el.modalCreate.style.display = 'flex';
    };

    el.btnOpenCreateModal.addEventListener('click', openCreate);
    if (el.btnHeroDispatch) el.btnHeroDispatch.addEventListener('click', openCreate);

    document.querySelectorAll('.btn-modal-close, .btn-cancel-modal').forEach(btn => {
      btn.addEventListener('click', closeModals);
    });

    el.formCreate.addEventListener('submit', handleCreateShipment);
    el.formEdit.addEventListener('submit', handleEditShipment);

    // Drawer
    el.btnCloseDrawer.addEventListener('click', closeDrawer);
    el.btnDrawerQuickEdit.addEventListener('click', () => {
      if (state.activeShipment) {
        closeDrawer();
        openEditModal(state.activeShipment.id);
      }
    });
    el.btnDrawerQuickDelete.addEventListener('click', () => {
      if (state.activeShipment) {
        handleDeleteShipment(state.activeShipment.id);
      }
    });

    // Telemetry Presets
    if (el.btnHeroSimulateTelemetry) {
      el.btnHeroSimulateTelemetry.addEventListener('click', () => {
        switchTab('tab-telemetry');
      });
    }

    el.presetPharmaOptimal.addEventListener('click', () => {
      document.getElementById('tel-temp').value = '-19.4';
      document.getElementById('tel-speed').value = '94.2';
      document.getElementById('tel-battery').value = '88';
      el.presetPharmaOptimal.classList.add('active');
      el.presetPharmaBreach.classList.remove('active');
      el.presetExpressRun.classList.remove('active');
    });

    el.presetPharmaBreach.addEventListener('click', () => {
      document.getElementById('tel-temp').value = '-14.2';
      document.getElementById('tel-speed').value = '82.0';
      document.getElementById('tel-battery').value = '65';
      el.presetPharmaBreach.classList.add('active');
      el.presetPharmaOptimal.classList.remove('active');
      el.presetExpressRun.classList.remove('active');
    });

    el.presetExpressRun.addEventListener('click', () => {
      document.getElementById('tel-temp').value = '18.5';
      document.getElementById('tel-speed').value = '105.8';
      document.getElementById('tel-battery').value = '92';
      el.presetExpressRun.classList.add('active');
      el.presetPharmaOptimal.classList.remove('active');
      el.presetPharmaBreach.classList.remove('active');
    });

    el.formIngestTelemetry.addEventListener('submit', handleIngestTelemetry);
    el.btnPurgeTelemetry.addEventListener('click', handlePurgeTelemetry);

    // RBAC Simulations
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

    // Traffic Burst
    el.btnSimulateTraffic.addEventListener('click', simulateClusterTraffic);

    // Audit
    el.btnRefreshAudit.addEventListener('click', fetchAuditLogs);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== el.globalSearchInput && document.activeElement !== el.inputSearchShipments) {
        e.preventDefault();
        el.globalSearchInput.focus();
      }
      if (e.key === 'Escape') {
        closeModals();
        closeDrawer();
        dismissRejection();
      }
    });
  }

  // --- Initialize Application ---
  async function init() {
    initEvents();
    await authenticateAs('admin_marcus');
    await fetchShipments();
    await fetchTelemetry();
    await updateKPISummary();
    console.log('[APEXTRACK] Modern High-Fidelity UI Engine Initialized.');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
