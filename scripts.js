/**
 * DISPATCH-OPS Command Deck - Core Operational Logic
 * Pure Vanilla JavaScript (Zero External Libraries, Zero Frameworks)
 * Handles incident intake, resource allocation, inventory locks, SVG map,
 * pure vanilla visualizers, filtering, search, and localStorage persistence.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'DISPATCH_OPS_STATE_V2';

  // Sector Geometric Bounds for realistic pin placement
  const SECTOR_BOUNDS = {
    Alpha: { minX: 70, maxX: 230, minY: 50, maxY: 170 },
    Bravo: { minX: 300, maxX: 490, minY: 50, maxY: 170 },
    Charlie: { minX: 560, maxX: 740, minY: 50, maxY: 170 },
    Delta: { minX: 70, maxX: 330, minY: 230, maxY: 330 },
    Echo: { minX: 420, maxX: 740, minY: 230, maxY: 330 }
  };

  // Preset Scenario Seed Data (Flash Flood & Severe Storm Emergency)
  function getDefaultState() {
    return {
      inventory: {
        paramedics: {
          name: 'Paramedic Response Teams',
          available: 5,
          total: 8,
          icon: 'med'
        },
        rescueVehicles: {
          name: 'Amphibious & 4x4 Rescue Craft',
          available: 3,
          total: 6,
          icon: 'veh'
        },
        heavyAirSupport: {
          name: 'Supply Trucks & Cargo Helicopters',
          available: 1,
          total: 3,
          icon: 'air'
        }
      },
      incidents: [
        {
          id: 'INC-8401',
          callerName: 'Sgt. D. Kowalski',
          callerContact: '555-0149',
          location: 'Riverfront Basin, Lower Pier 4',
          sector: 'Alpha',
          coordinates: { x: 130, y: 110 },
          severity: 'critical',
          needs: 'paramedics',
          notes: 'Elderly shelter lower floor inundated. 6 civilians isolated with onset hypothermia. Immediate triage requested.',
          status: 'dispatched',
          dispatchedUnits: 1,
          timestamp: Date.now() - 14 * 60 * 1000
        },
        {
          id: 'INC-8402',
          callerName: 'Harbor Control Unit 9',
          callerContact: '555-0812',
          location: 'Terminal 3, Industrial Port Canal',
          sector: 'Charlie',
          coordinates: { x: 670, y: 120 },
          severity: 'critical',
          needs: 'rescueVehicles',
          notes: 'Gantry crane compromised by tidal surge. 3 dockworkers trapped in cabin hanging over canal.',
          status: 'active',
          dispatchedUnits: 0,
          timestamp: Date.now() - 9 * 60 * 1000
        },
        {
          id: 'INC-8403',
          callerName: 'State Trooper Vance',
          callerContact: '555-9201',
          location: 'Interstate 80 Overpass, Transit Junction',
          sector: 'Echo',
          coordinates: { x: 580, y: 270 },
          severity: 'high',
          needs: 'heavyAirSupport',
          notes: 'Mudslide severed exit ramps. Approx 40 passenger vehicles stranded without fuel, drinking water or heat.',
          status: 'dispatched',
          dispatchedUnits: 1,
          timestamp: Date.now() - 25 * 60 * 1000
        },
        {
          id: 'INC-8404',
          callerName: 'City Power Dispatch',
          callerContact: '555-4389',
          location: 'Central Substation, 4th & Elm Ave',
          sector: 'Bravo',
          coordinates: { x: 380, y: 130 },
          severity: 'high',
          needs: 'paramedics',
          notes: 'Transformer arching during flood surge. Two technicians sustained flash burns. Scene secured by utility team.',
          status: 'dispatched',
          dispatchedUnits: 1,
          timestamp: Date.now() - 38 * 60 * 1000
        },
        {
          id: 'INC-8405',
          callerName: 'Elena Rostova (Resident)',
          callerContact: '555-7720',
          location: 'Highland Bluffs Ridge Road',
          sector: 'Delta',
          coordinates: { x: 190, y: 280 },
          severity: 'moderate',
          needs: 'rescueVehicles',
          notes: 'Fallen timber across mountain access road. Two residential properties cut off; no immediate injuries.',
          status: 'active',
          dispatchedUnits: 0,
          timestamp: Date.now() - 55 * 60 * 1000
        },
        {
          id: 'INC-8398',
          callerName: 'Officer Mendez',
          callerContact: '555-1104',
          location: 'River Road Crossing, Sector Alpha',
          sector: 'Alpha',
          coordinates: { x: 80, y: 70 },
          severity: 'critical',
          needs: 'paramedics',
          notes: 'Family vehicle stalled in flash stream. Swift-water team pulled 4 passengers safely to dry embankment.',
          status: 'resolved',
          dispatchedUnits: 0,
          timestamp: Date.now() - 110 * 60 * 1000
        },
        {
          id: 'INC-8395',
          callerName: 'Water Utility Engineer',
          callerContact: '555-3341',
          location: 'Metro Pump Facility #2',
          sector: 'Bravo',
          coordinates: { x: 450, y: 70 },
          severity: 'moderate',
          needs: 'heavyAirSupport',
          notes: 'Auxiliary diesel generator delivered by cargo truck to sustain municipal pumps. Operation stabilized.',
          status: 'resolved',
          dispatchedUnits: 0,
          timestamp: Date.now() - 160 * 60 * 1000
        }
      ],
      filter: {
        keyword: '',
        urgency: 'all',
        sector: null
      },
      sortBy: 'priority'
    };
  }

  // Active state
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.inventory && Array.isArray(parsed.incidents)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return getDefaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  const clockEl = document.getElementById('mission-clock');
  const statActiveCount = document.getElementById('stat-active-count');
  const statCriticalCount = document.getElementById('stat-critical-count');
  const statDeployedCount = document.getElementById('stat-deployed-count');
  const statResolvedCount = document.getElementById('stat-resolved-count');

  const inventoryContainer = document.getElementById('inventory-list-container');
  const mapPinsLayer = document.getElementById('map-pins-layer');
  const mapTooltip = document.getElementById('map-tooltip');
  const tacticalMap = document.getElementById('tactical-map');
  const mapSectorFilterBadge = document.getElementById('map-sector-filter-badge');
  const btnClearSectorFilter = document.getElementById('btn-clear-sector-filter');

  const barResolved = document.getElementById('bar-resolved');
  const barDispatched = document.getElementById('bar-dispatched');
  const barPending = document.getElementById('bar-pending');
  const vizResPct = document.getElementById('viz-resolution-percent');
  const vizCountResolved = document.getElementById('viz-count-resolved');
  const vizCountDispatched = document.getElementById('viz-count-dispatched');
  const vizCountPending = document.getElementById('viz-count-pending');

  const vizDepPct = document.getElementById('viz-deployment-percent');
  const gaugeFill = document.getElementById('gauge-circle-fill');
  const vizUnitsCommitted = document.getElementById('viz-units-committed');
  const vizUnitsReserve = document.getElementById('viz-units-reserve');
  const vizUnitsTotal = document.getElementById('viz-units-total');

  const incidentsStream = document.getElementById('incidents-stream');
  const feedCountBadge = document.getElementById('feed-count-badge');
  const searchInput = document.getElementById('feed-search-input');
  const sortSelect = document.getElementById('feed-sort-select');
  const urgencyFilterBar = document.getElementById('urgency-filter-bar');

  const incidentForm = document.getElementById('incident-form');
  const backupModal = document.getElementById('backup-modal');
  const btnOpenBackup = document.getElementById('btn-open-backup-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnQuickSample = document.getElementById('btn-quick-sample');
  const btnResetScenario = document.getElementById('btn-reset-scenario');
  const toastContainer = document.getElementById('toast-container');

  // ========================================================================
  // CLOCK & TIMERS
  // ========================================================================
  function updateClock() {
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
    const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
    if (clockEl) {
      clockEl.textContent = `${utcHours}:${utcMins}:${utcSecs} UTC`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ========================================================================
  // TOAST NOTIFICATIONS
  // ========================================================================
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'toast-danger' : type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      <button style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;">&times;</button>
    `;
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => toast.remove());

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    });
  }

  function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  // ========================================================================
  // RENDER: INVENTORY PANEL
  // ========================================================================
  function renderInventory() {
    if (!inventoryContainer) return;
    inventoryContainer.innerHTML = '';

    const categories = [
      { key: 'paramedics', label: 'Paramedic Teams', iconSvg: '<path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' },
      { key: 'rescueVehicles', label: 'Rescue Vehicles & Boats', iconSvg: '<rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="currentColor" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/><circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>' },
      { key: 'heavyAirSupport', label: 'Helicopters & Cargo Trucks', iconSvg: '<path d="M3 10h18M12 2v8M6 14l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' }
    ];

    categories.forEach(cat => {
      const inv = state.inventory[cat.key];
      const isDepleted = inv.available <= 0;
      const percentAvail = inv.total > 0 ? (inv.available / inv.total) * 100 : 0;
      const deployedCount = Math.max(0, inv.total - inv.available);

      const itemEl = document.createElement('div');
      itemEl.className = `inventory-item ${isDepleted ? 'depleted' : ''}`;
      itemEl.innerHTML = `
        <div class="inventory-head">
          <div class="inventory-name">
            <svg class="inventory-icon" viewBox="0 0 24 24" fill="none">${cat.iconSvg}</svg>
            <span>${cat.label}</span>
          </div>
          <div class="inventory-counts tabular-nums">
            <span class="count-avail ${inv.available === 0 ? 'zero' : ''}">${inv.available}</span>
            <span class="count-divider">/</span>
            <span class="count-total">${inv.total} ready</span>
          </div>
        </div>

        <div class="inventory-progress-track" title="${inv.available} ready of ${inv.total} total units">
          <div class="inventory-progress-fill ${isDepleted ? 'empty' : percentAvail <= 25 ? 'low' : ''}" style="width: ${percentAvail}%"></div>
        </div>

        <div class="inventory-footer">
          <div>
            <span class="depleted-notice">DEPLETED - REQUISITION NEEDED</span>
            <span style="display:${isDepleted ? 'none' : 'inline'};">${deployedCount} in field · ${inv.available} ready</span>
          </div>
          <button class="btn-mini-add" data-quick-add="${cat.key}" title="Add 1 emergency reserve unit to this battalion">+1 Unit</button>
        </div>
      `;

      const addBtn = itemEl.querySelector('[data-quick-add]');
      addBtn.addEventListener('click', () => {
        state.inventory[cat.key].available += 1;
        state.inventory[cat.key].total += 1;
        saveState();
        renderAll();
        showToast(`Added +1 unit to ${cat.label} (Total: ${state.inventory[cat.key].total})`, 'success');
      });

      inventoryContainer.appendChild(itemEl);
    });
  }

  // ========================================================================
  // RENDER: PURE VANILLA DATA VISUALIZERS (NO EXTERNAL LIBS)
  // ========================================================================
  function renderVisualizers() {
    const totalIncidents = state.incidents.length;
    let resolvedCount = 0;
    let dispatchedCount = 0;
    let pendingCount = 0;
    let criticalCount = 0;

    state.incidents.forEach(inc => {
      if (inc.status === 'resolved') {
        resolvedCount++;
      } else if (inc.status === 'dispatched') {
        dispatchedCount++;
      } else {
        pendingCount++;
      }
      if (inc.severity === 'critical' && inc.status !== 'resolved') {
        criticalCount++;
      }
    });

    const activeCount = dispatchedCount + pendingCount;

    // Update Top Bar Telemetry
    if (statActiveCount) statActiveCount.textContent = activeCount;
    if (statCriticalCount) statCriticalCount.textContent = criticalCount;
    if (statResolvedCount) statResolvedCount.textContent = resolvedCount;

    // Visualizer 1: Multi-Segment Incident Resolution Progress Bar
    const pctResolved = totalIncidents > 0 ? (resolvedCount / totalIncidents) * 100 : 0;
    const pctDispatched = totalIncidents > 0 ? (dispatchedCount / totalIncidents) * 100 : 0;
    const pctPending = totalIncidents > 0 ? (pendingCount / totalIncidents) * 100 : 0;

    if (barResolved) barResolved.style.width = `${pctResolved}%`;
    if (barDispatched) barDispatched.style.width = `${pctDispatched}%`;
    if (barPending) barPending.style.width = `${pctPending}%`;

    if (vizResPct) vizResPct.textContent = `${Math.round(pctResolved)}% Resolved`;
    if (vizCountResolved) vizCountResolved.textContent = resolvedCount;
    if (vizCountDispatched) vizCountDispatched.textContent = dispatchedCount;
    if (vizCountPending) vizCountPending.textContent = pendingCount;

    // Visualizer 2: Pure SVG Fleet Resource Deployment Dial
    let fleetTotal = 0;
    let fleetAvailable = 0;

    Object.values(state.inventory).forEach(inv => {
      fleetTotal += inv.total;
      fleetAvailable += inv.available;
    });

    const fleetDeployed = Math.max(0, fleetTotal - fleetAvailable);
    if (statDeployedCount) statDeployedCount.textContent = fleetDeployed;

    const deployedPercent = fleetTotal > 0 ? (fleetDeployed / fleetTotal) * 100 : 0;

    if (vizDepPct) vizDepPct.textContent = `${Math.round(deployedPercent)}%`;

    // SVG radial gauge circumference for r=15 is 2 * PI * 15 = 94.2477
    const circumference = 94.25;
    const offset = circumference * (1 - (deployedPercent / 100));
    if (gaugeFill) {
      gaugeFill.style.strokeDashoffset = String(offset);
      if (deployedPercent >= 85) {
        gaugeFill.style.stroke = 'var(--status-critical)';
      } else if (deployedPercent >= 60) {
        gaugeFill.style.stroke = 'var(--status-high)';
      } else {
        gaugeFill.style.stroke = 'var(--accent-cyan)';
      }
    }

    if (vizUnitsCommitted) vizUnitsCommitted.textContent = `${fleetDeployed} units`;
    if (vizUnitsReserve) vizUnitsReserve.textContent = `${fleetAvailable} units`;
    if (vizUnitsTotal) vizUnitsTotal.textContent = `${fleetTotal} units`;
  }

  // ========================================================================
  // RENDER: TACTICAL SVG SECTOR MAP
  // ========================================================================
  function renderMap() {
    if (!mapPinsLayer) return;
    mapPinsLayer.innerHTML = '';

    const currentSectorFilter = state.filter.sector;
    if (mapSectorFilterBadge) {
      mapSectorFilterBadge.textContent = currentSectorFilter
        ? `SECTOR ${currentSectorFilter.toUpperCase()} FILTERED`
        : 'ALL SECTORS VIEW';
    }
    if (btnClearSectorFilter) {
      btnClearSectorFilter.style.display = currentSectorFilter ? 'inline-block' : 'none';
    }

    // Highlight active sector polygon if filtered
    const sectorPolys = document.querySelectorAll('.map-sector-fill');
    sectorPolys.forEach(poly => {
      const s = poly.getAttribute('data-sector');
      if (currentSectorFilter && s === currentSectorFilter) {
        poly.classList.add('active');
      } else {
        poly.classList.remove('active');
      }
    });

    state.incidents.forEach(inc => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'map-pin');
      g.setAttribute('data-id', inc.id);
      g.setAttribute('transform', `translate(${inc.coordinates.x}, ${inc.coordinates.y})`);

      let pinColor = 'var(--status-critical)';
      if (inc.status === 'resolved') {
        pinColor = 'var(--status-resolved)';
      } else if (inc.status === 'dispatched') {
        pinColor = 'var(--status-dispatched)';
      } else if (inc.severity === 'high') {
        pinColor = 'var(--status-high)';
      } else if (inc.severity === 'moderate') {
        pinColor = 'var(--status-moderate)';
      }

      // If active / high urgency, render pulsing wave
      let pulseSvg = '';
      if (inc.status !== 'resolved') {
        pulseSvg = `<circle class="map-pin-pulse" cx="0" cy="0" r="8" fill="none" stroke="${pinColor}" stroke-width="1.8" />`;
      }

      g.innerHTML = `
        ${pulseSvg}
        <circle cx="0" cy="0" r="5" fill="${pinColor}" stroke="#0f172a" stroke-width="1.5" />
        <text x="0" y="11" fill="${pinColor}" font-size="8" font-family="var(--font-mono)" font-weight="700" text-anchor="middle">${inc.id.replace('INC-', '')}</text>
      `;

      // Tooltip interactions
      g.addEventListener('mouseenter', (e) => {
        if (!mapTooltip) return;
        const rect = tacticalMap.getBoundingClientRect();
        const pinPos = g.getBoundingClientRect();

        mapTooltip.innerHTML = `
          <div style="font-weight:700; color:${pinColor}; margin-bottom:2px;">${inc.id} · ${inc.severity.toUpperCase()}</div>
          <div style="font-weight:600; color:#ffffff; font-size:11px;">${escapeHtml(inc.location)}</div>
          <div style="color:var(--text-dim); font-size:10px; margin-top:2px;">Needs: ${getCategoryLabel(inc.needs)}</div>
          <div style="color:var(--text-muted); font-size:10px; margin-top:3px;">${escapeHtml(inc.notes)}</div>
          <div style="margin-top:4px; font-size:9px; color:#38bdf8;">Click pin to highlight card in stream</div>
        `;

        mapTooltip.style.display = 'block';
        const left = pinPos.left - rect.left + 10;
        const top = pinPos.top - rect.top - 10;
        mapTooltip.style.left = `${Math.min(left, rect.width - 250)}px`;
        mapTooltip.style.top = `${Math.max(10, top)}px`;
      });

      g.addEventListener('mouseleave', () => {
        if (mapTooltip) mapTooltip.style.display = 'none';
      });

      // Clicking pin scrolls to and highlights incident card
      g.addEventListener('click', () => {
        highlightIncidentCard(inc.id);
      });

      mapPinsLayer.appendChild(g);
    });
  }

  function getCategoryLabel(key) {
    switch (key) {
      case 'paramedics': return 'Paramedic Response Team';
      case 'rescueVehicles': return 'Amphibious / 4x4 Rescue Craft';
      case 'heavyAirSupport': return 'Supply Truck / Helo';
      default: return key;
    }
  }

  function highlightIncidentCard(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 2400);
    } else {
      showToast(`Incident ${id} is currently filtered out of view.`, 'info');
    }
  }

  // ========================================================================
  // RENDER: INCIDENT FEED & ACTIONS
  // ========================================================================
  function renderFeed() {
    if (!incidentsStream) return;
    incidentsStream.innerHTML = '';

    // Update urgency counts in filter tabs
    updateFilterCounts();

    // Filter & Sort
    let list = [...state.incidents];

    // Filter by keyword
    if (state.filter.keyword) {
      const q = state.filter.keyword.toLowerCase().trim();
      list = list.filter(inc => {
        return (
          inc.id.toLowerCase().includes(q) ||
          inc.callerName.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.notes.toLowerCase().includes(q) ||
          inc.sector.toLowerCase().includes(q)
        );
      });
    }

    // Filter by sector (if chosen on map)
    if (state.filter.sector) {
      list = list.filter(inc => inc.sector === state.filter.sector);
    }

    // Filter by urgency tab
    if (state.filter.urgency !== 'all') {
      if (state.filter.urgency === 'dispatched') {
        list = list.filter(inc => inc.status === 'dispatched');
      } else if (state.filter.urgency === 'resolved') {
        list = list.filter(inc => inc.status === 'resolved');
      } else {
        list = list.filter(inc => inc.severity === state.filter.urgency && inc.status !== 'resolved');
      }
    }

    // Sort
    if (state.sortBy === 'priority') {
      const priorityOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
      list.sort((a, b) => {
        if (a.status === 'resolved' && b.status !== 'resolved') return 1;
        if (b.status === 'resolved' && a.status !== 'resolved') return -1;
        const pDiff = (priorityOrder[b.severity] || 0) - (priorityOrder[a.severity] || 0);
        if (pDiff !== 0) return pDiff;
        return b.timestamp - a.timestamp;
      });
    } else if (state.sortBy === 'newest') {
      list.sort((a, b) => b.timestamp - a.timestamp);
    } else if (state.sortBy === 'sector') {
      list.sort((a, b) => a.sector.localeCompare(b.sector));
    }

    if (feedCountBadge) {
      feedCountBadge.textContent = `${list.length} OF ${state.incidents.length} CALLS`;
    }

    if (list.length === 0) {
      incidentsStream.innerHTML = `
        <div class="empty-state">
          <p>No incidents match the active search or filter criteria.</p>
          <button class="btn btn-secondary" id="btn-reset-filters" style="margin-top:10px;">Clear Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.filter.keyword = '';
          state.filter.urgency = 'all';
          state.filter.sector = null;
          if (searchInput) searchInput.value = '';
          setActiveFilterTab('all');
          saveState();
          renderAll();
        });
      }
      return;
    }

    list.forEach(inc => {
      const invForNeed = state.inventory[inc.needs] || { available: 0, name: inc.needs };
      const isInventoryZero = invForNeed.available <= 0;
      const isResolved = inc.status === 'resolved';
      const isDispatched = inc.status === 'dispatched';

      const card = document.createElement('article');
      card.id = `card-${inc.id}`;
      card.className = `incident-card severity-${inc.severity} status-${inc.status}`;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-title-group">
            <span class="card-id tag-id">${inc.id}</span>
            <span class="severity-tag ${inc.severity}">${inc.severity} PRIORITY</span>
          </div>
          <div class="card-meta-line">
            <span>SEC-${inc.sector.toUpperCase()}</span>
            <span>·</span>
            <span class="time-val">${formatTimeAgo(inc.timestamp)}</span>
          </div>
        </div>

        <div>
          <div class="card-location">${escapeHtml(inc.location)}</div>
          <div class="card-meta-line" style="margin-top:2px;">
            <span>Caller: ${escapeHtml(inc.callerName)}</span>
            <span>·</span>
            <span>${escapeHtml(inc.callerContact)}</span>
          </div>
        </div>

        <div class="card-details">${escapeHtml(inc.notes)}</div>

        <div class="card-allocation-status">
          <div class="alloc-needs">
            Required: <strong>${getCategoryLabel(inc.needs)}</strong>
          </div>
          <div class="alloc-units tabular-nums ${isResolved ? 'resolved' : isDispatched ? 'deployed' : 'pending'}">
            ${isResolved ? 'Status: RESOLVED' : isDispatched ? `Assigned: ${inc.dispatchedUnits || 1} Fielded` : 'Status: PENDING DISPATCH'}
          </div>
        </div>

        <div class="card-actions">
          <!-- Over-allocation warning display -->
          <span class="lack-of-resource-msg ${isInventoryZero && !isResolved ? 'visible' : ''}">
            &#9888; LACK OF RESOURCE (0 AVAILABLE)
          </span>

          ${!isResolved ? `
            <button class="btn btn-dispatch" data-dispatch-id="${inc.id}" ${isInventoryZero ? 'disabled title="Dispatch disabled: zero available inventory in this category"' : 'title="Dispatch available unit to this incident"'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              ${isDispatched ? 'Dispatch +1 Unit' : 'Dispatch Resource'}
            </button>

            <button class="btn btn-resolve" data-resolve-id="${inc.id}" title="Stabilize incident and return deployed resources to inventory pool">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Mark Resolved
            </button>
          ` : `
            <span style="font-size:11px; color:var(--status-resolved); font-weight:700; margin-right:auto;">
              &#10003; RESOLVED & STABILIZED
            </span>
            <button class="btn btn-secondary" data-reopen-id="${inc.id}" style="font-size:10px; padding:3px 8px;" title="Reopen incident if new distress report arrives">
              Reopen
            </button>
          `}

          <button class="btn btn-danger-quiet" data-delete-id="${inc.id}" title="Remove incident from active operational deck">
            Dismiss
          </button>
        </div>
      `;

      // Event Handlers for Dispatch / Resolve / Reopen / Delete
      const dispatchBtn = card.querySelector('[data-dispatch-id]');
      if (dispatchBtn) {
        dispatchBtn.addEventListener('click', () => dispatchResource(inc.id));
      }

      const resolveBtn = card.querySelector('[data-resolve-id]');
      if (resolveBtn) {
        resolveBtn.addEventListener('click', () => resolveIncident(inc.id));
      }

      const reopenBtn = card.querySelector('[data-reopen-id]');
      if (reopenBtn) {
        reopenBtn.addEventListener('click', () => reopenIncident(inc.id));
      }

      const deleteBtn = card.querySelector('[data-delete-id]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteIncident(inc.id));
      }

      incidentsStream.appendChild(card);
    });
  }

  function updateFilterCounts() {
    let all = state.incidents.length;
    let critical = 0;
    let high = 0;
    let moderate = 0;
    let dispatched = 0;
    let resolved = 0;

    state.incidents.forEach(inc => {
      if (inc.status === 'resolved') {
        resolved++;
      } else {
        if (inc.status === 'dispatched') dispatched++;
        if (inc.severity === 'critical') critical++;
        if (inc.severity === 'high') high++;
        if (inc.severity === 'moderate') moderate++;
      }
    });

    const setCnt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `(${val})`;
    };
    setCnt('filter-cnt-all', all);
    setCnt('filter-cnt-critical', critical);
    setCnt('filter-cnt-high', high);
    setCnt('filter-cnt-moderate', moderate);
    setCnt('filter-cnt-dispatched', dispatched);
    setCnt('filter-cnt-resolved', resolved);
  }

  function setActiveFilterTab(filterValue) {
    const tabs = urgencyFilterBar?.querySelectorAll('.filter-tab');
    tabs?.forEach(tab => {
      if (tab.getAttribute('data-filter') === filterValue) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // ========================================================================
  // CORE ACTION LOGIC: DISPATCH, RESOLVE, REOPEN, INTAKE
  // ========================================================================
  function dispatchResource(incidentId) {
    const inc = state.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    const resourceCategory = inc.needs;
    const inv = state.inventory[resourceCategory];

    // Check availability guard
    if (!inv || inv.available <= 0) {
      showToast(`LACK OF RESOURCE: Zero available units for ${getCategoryLabel(resourceCategory)}. Call backup forces!`, 'danger');
      return;
    }

    // Decrement inventory
    inv.available -= 1;
    inc.dispatchedUnits = (inc.dispatchedUnits || 0) + 1;
    inc.status = 'dispatched';

    saveState();
    renderAll();
    showToast(`Dispatched unit to ${inc.id} (${inc.location}). Units Fielded: ${inc.dispatchedUnits}`, 'success');
  }

  function resolveIncident(incidentId) {
    const inc = state.incidents.find(i => i.id === incidentId);
    if (!inc || inc.status === 'resolved') return;

    const unitsToReturn = inc.dispatchedUnits || 0;
    const resourceCategory = inc.needs;

    // Return dispatched units to inventory
    if (state.inventory[resourceCategory]) {
      state.inventory[resourceCategory].available = Math.min(
        state.inventory[resourceCategory].total,
        state.inventory[resourceCategory].available + unitsToReturn
      );
    }

    inc.dispatchedUnits = 0;
    inc.status = 'resolved';

    saveState();
    renderAll();
    showToast(`Incident ${inc.id} marked RESOLVED. Returned ${unitsToReturn} resource(s) to ready reserve.`, 'success');
  }

  function reopenIncident(incidentId) {
    const inc = state.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    inc.status = 'active';
    inc.dispatchedUnits = 0;
    saveState();
    renderAll();
    showToast(`Reopened incident ${inc.id}. Status set to PENDING DISPATCH.`, 'info');
  }

  function deleteIncident(incidentId) {
    const inc = state.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    // If it had dispatched units, return them
    if (inc.dispatchedUnits > 0 && state.inventory[inc.needs]) {
      state.inventory[inc.needs].available = Math.min(
        state.inventory[inc.needs].total,
        state.inventory[inc.needs].available + inc.dispatchedUnits
      );
    }

    state.incidents = state.incidents.filter(i => i.id !== incidentId);
    saveState();
    renderAll();
    showToast(`Incident ${incidentId} dismissed from active log.`, 'info');
  }

  // ========================================================================
  // COORDINATE GENERATOR FOR NEW INCIDENTS
  // ========================================================================
  function getRandomCoordsForSector(sector) {
    const bounds = SECTOR_BOUNDS[sector] || SECTOR_BOUNDS.Alpha;
    const x = Math.floor(bounds.minX + Math.random() * (bounds.maxX - bounds.minX));
    const y = Math.floor(bounds.minY + Math.random() * (bounds.maxY - bounds.minY));
    return { x, y };
  }

  // ========================================================================
  // FORM SUBMISSION: INTAKE CALL
  // ========================================================================
  if (incidentForm) {
    incidentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const callerName = document.getElementById('caller-name')?.value.trim();
      const callerContact = document.getElementById('caller-contact')?.value.trim();
      const location = document.getElementById('incident-location')?.value.trim();
      const sector = document.getElementById('incident-sector')?.value;
      const needs = document.getElementById('incident-needs')?.value;
      const notes = document.getElementById('incident-notes')?.value.trim();

      const severityEl = document.querySelector('input[name="severity"]:checked');
      const severity = severityEl ? severityEl.value : 'critical';

      if (!callerName || !location || !notes) {
        showToast('Please fill out all required incident fields.', 'danger');
        return;
      }

      // Generate next INC-XXXX id
      const nextNum = 8400 + state.incidents.length + Math.floor(Math.random() * 50);
      const newId = `INC-${nextNum}`;
      const coords = getRandomCoordsForSector(sector);

      const newIncident = {
        id: newId,
        callerName,
        callerContact,
        location,
        sector,
        coordinates: coords,
        severity,
        needs,
        notes,
        status: 'active',
        dispatchedUnits: 0,
        timestamp: Date.now()
      };

      // Push to front of incidents list
      state.incidents.unshift(newIncident);
      saveState();

      // Reset form fields
      incidentForm.reset();
      const defaultRadio = document.querySelector('input[name="severity"][value="critical"]');
      if (defaultRadio) defaultRadio.checked = true;

      renderAll();
      showToast(`NEW CALL LOGGED: ${newId} in Sector ${sector}. Plotted to tactical radar.`, 'success');
      highlightIncidentCard(newId);
    });
  }

  // Form Presets Click Handlers
  const presetButtons = document.querySelectorAll('[data-preset]');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-preset');
      const nameInput = document.getElementById('caller-name');
      const phoneInput = document.getElementById('caller-contact');
      const locInput = document.getElementById('incident-location');
      const sectorSelect = document.getElementById('incident-sector');
      const needsSelect = document.getElementById('incident-needs');
      const notesInput = document.getElementById('incident-notes');

      if (type === 'flash-flood') {
        if (nameInput) nameInput.value = 'Capt. Reynolds (Fire Dept)';
        if (phoneInput) phoneInput.value = '555-4011';
        if (locInput) locInput.value = 'Marina Blvd & River Walk';
        if (sectorSelect) sectorSelect.value = 'Alpha';
        if (needsSelect) needsSelect.value = 'rescueVehicles';
        if (notesInput) notesInput.value = 'Retaining barrier gave way. Rapid 3ft water rise. 8 people stranded on park benches.';
        checkRadio('critical');
      } else if (type === 'roof-rescue') {
        if (nameInput) nameInput.value = 'David Chen';
        if (phoneInput) phoneInput.value = '555-8832';
        if (locInput) locInput.value = '822 Sycamore Terrace, Apt 3';
        if (sectorSelect) sectorSelect.value = 'Delta';
        if (needsSelect) needsSelect.value = 'rescueVehicles';
        if (notesInput) notesInput.value = 'Mudslide breached ground level structure. Family of 4 safe on upper balcony awaiting evacuation.';
        checkRadio('high');
      } else if (type === 'medical-crisis') {
        if (nameInput) nameInput.value = 'Triage Station Bravo';
        if (phoneInput) phoneInput.value = '555-1990';
        if (locInput) locInput.value = 'Civic Center Evac Shelter';
        if (sectorSelect) sectorSelect.value = 'Bravo';
        if (needsSelect) needsSelect.value = 'paramedics';
        if (notesInput) notesInput.value = 'Elderly evacuee exhibiting severe chest pains and shortness of breath. ALS ambulance required.';
        checkRadio('critical');
      } else if (type === 'cargo-drop') {
        if (nameInput) nameInput.value = 'Logistics Sector Echo';
        if (phoneInput) phoneInput.value = '555-6677';
        if (locInput) locInput.value = 'Highway 10 Mile Marker 42';
        if (sectorSelect) sectorSelect.value = 'Echo';
        if (needsSelect) needsSelect.value = 'heavyAirSupport';
        if (notesInput) notesInput.value = 'Isolated pocket of 25 motorists without potable water or heating blankets. Air drop requested.';
        checkRadio('high');
      }
    });
  });

  function checkRadio(val) {
    const radio = document.querySelector(`input[name="severity"][value="${val}"]`);
    if (radio) radio.checked = true;
  }

  // ========================================================================
  // BACKUP FORCES MODAL
  // ========================================================================
  if (btnOpenBackup) {
    btnOpenBackup.addEventListener('click', () => {
      if (backupModal) backupModal.classList.add('active');
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      if (backupModal) backupModal.classList.remove('active');
    });
  }

  if (backupModal) {
    backupModal.addEventListener('click', (e) => {
      if (e.target === backupModal) {
        backupModal.classList.remove('active');
      }
    });
  }

  // Requisition Packages
  const packageCards = document.querySelectorAll('.package-card');
  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      const pkg = card.getAttribute('data-package');
      if (pkg === 'paramedics') {
        state.inventory.paramedics.available += 4;
        state.inventory.paramedics.total += 4;
        showToast('REINFORCEMENTS ARRIVED: +4 Paramedic Teams added to ready inventory.', 'success');
      } else if (pkg === 'rescueVehicles') {
        state.inventory.rescueVehicles.available += 3;
        state.inventory.rescueVehicles.total += 3;
        showToast('REINFORCEMENTS ARRIVED: +3 Amphibious Rescue Craft & 4x4s added.', 'success');
      } else if (pkg === 'heavyAirSupport') {
        state.inventory.heavyAirSupport.available += 2;
        state.inventory.heavyAirSupport.total += 2;
        showToast('REINFORCEMENTS ARRIVED: +2 Cargo Trucks & Helicopters added.', 'success');
      } else if (pkg === 'combinedSurge') {
        state.inventory.paramedics.available += 3;
        state.inventory.paramedics.total += 3;
        state.inventory.rescueVehicles.available += 2;
        state.inventory.rescueVehicles.total += 2;
        state.inventory.heavyAirSupport.available += 2;
        state.inventory.heavyAirSupport.total += 2;
        showToast('REGIONAL SURGE AUTHORIZED: +3 Paramedics, +2 Rescue Craft, +2 Air Units deployed to reserve!', 'success');
      }

      saveState();
      renderAll();
      if (backupModal) backupModal.classList.remove('active');
    });
  });

  // ========================================================================
  // MAP SECTOR CLICKS & SECTOR FILTERS
  // ========================================================================
  const sectorPolygons = document.querySelectorAll('.map-sector-fill');
  sectorPolygons.forEach(poly => {
    poly.addEventListener('click', () => {
      const sector = poly.getAttribute('data-sector');
      if (state.filter.sector === sector) {
        state.filter.sector = null;
        showToast('Cleared Sector filter. Viewing all sectors.', 'info');
      } else {
        state.filter.sector = sector;
        showToast(`Filtered incident stream to Sector ${sector}.`, 'info');
      }
      saveState();
      renderAll();
    });
  });

  if (btnClearSectorFilter) {
    btnClearSectorFilter.addEventListener('click', () => {
      state.filter.sector = null;
      saveState();
      renderAll();
      showToast('Viewing all sectors.', 'info');
    });
  }

  // ========================================================================
  // SEARCH, FILTER, AND SORT HANDLERS
  // ========================================================================
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filter.keyword = e.target.value;
      renderFeed();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderFeed();
    });
  }

  if (urgencyFilterBar) {
    const tabs = urgencyFilterBar.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filterVal = tab.getAttribute('data-filter');
        state.filter.urgency = filterVal;
        setActiveFilterTab(filterVal);
        renderFeed();
      });
    });
  }

  // ========================================================================
  // SAMPLE CALL & RESET ACTIONS
  // ========================================================================
  if (btnQuickSample) {
    btnQuickSample.addEventListener('click', () => {
      const samples = [
        {
          caller: '911 Dispatch - Metro North',
          contact: '555-0911',
          location: 'Industrial Canal Lock #4',
          sector: 'Charlie',
          severity: 'critical',
          needs: 'rescueVehicles',
          notes: 'Maintenance barge loose from moorings. Water entering stern. 2 engineers on board.'
        },
        {
          caller: 'Highway Patrol Car 14',
          contact: '555-8812',
          location: 'Interstate 80 Junction East',
          sector: 'Echo',
          severity: 'high',
          needs: 'heavyAirSupport',
          notes: 'Bridge approach undercut by rushing water. Traffic halted. Supply truck needed for traffic barricades.'
        },
        {
          caller: 'Community Health Nurse',
          contact: '555-3211',
          location: 'Riverside Community Clinic',
          sector: 'Alpha',
          severity: 'critical',
          needs: 'paramedics',
          notes: 'Emergency oxygen generator failed due to water in basement. Two critical patients require immediate transfer.'
        }
      ];

      const sample = samples[Math.floor(Math.random() * samples.length)];
      const nextNum = 8410 + state.incidents.length + Math.floor(Math.random() * 20);
      const newId = `INC-${nextNum}`;
      const coords = getRandomCoordsForSector(sample.sector);

      const newInc = {
        id: newId,
        callerName: sample.caller,
        callerContact: sample.contact,
        location: sample.location,
        sector: sample.sector,
        coordinates: coords,
        severity: sample.severity,
        needs: sample.needs,
        notes: sample.notes,
        status: 'active',
        dispatchedUnits: 0,
        timestamp: Date.now()
      };

      state.incidents.unshift(newInc);
      saveState();
      renderAll();
      showToast(`SIMULATED INBOUND CALL: ${newId} logged in Sector ${sample.sector}`, 'info');
      highlightIncidentCard(newId);
    });
  }

  if (btnResetScenario) {
    btnResetScenario.addEventListener('click', () => {
      if (confirm('Reset dashboard to default disaster crisis scenario? All current changes will be restored to baseline.')) {
        state = getDefaultState();
        saveState();
        if (searchInput) searchInput.value = '';
        setActiveFilterTab('all');
        renderAll();
        showToast('Dashboard reset to default storm crisis baseline.', 'info');
      }
    });
  }

  // ========================================================================
  // RENDER MASTER
  // ========================================================================
  function renderAll() {
    renderInventory();
    renderVisualizers();
    renderMap();
    renderFeed();
  }

  // Initial Load
  renderAll();
})();
