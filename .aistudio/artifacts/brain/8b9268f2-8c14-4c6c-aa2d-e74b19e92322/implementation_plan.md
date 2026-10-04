# Tactical Disaster Response Operations Dashboard (DISPATCH-OPS)

A high-contrast, mission-critical operational dispatch dashboard engineered in pure vanilla HTML5, CSS, and JavaScript. Designed for rapid emergency dispatch, incident call intake, dynamic resource inventory management, visual SVG sector mapping, and instant backup reinforcement.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions were confirmed through Phase 1 user clarification:
> - **Vanilla Real-Time Emergency Map**: Interactive SVG tactical sector grid with coordinate-based zones and live pulsing incident pins that link directly to active emergencies.
> - **Backup Forces Reinforcement**: Instant reinforcement modal allowing incident commanders to requisition specific unit battalions (paramedics, rescue craft, heavy supply helicopters) to immediately replenish depleted inventory.
> - **Initial Scenario State**: Preloaded with a realistic flash flood and storm crisis scenario with active calls, dispatched teams, and resolved historical records for immediate operational utility.
> - **Zero External Dependency Rule**: Strictly zero React, Tailwind, Bootstrap, CDN icons, or external chart/map scripts. Clean three-file split: `index.html`, `style.css`, and `scripts.js`.

---

## 1. Overview & Core Concept

- **What It Does**: Serves as a disaster response commander's desktop workstation. Coordinates incoming emergency distress calls, triages incidents by severity (Critical, High, Moderate, Low), allocates specialized response vehicles and paramedic teams, visually charts resource depletion and incident resolution ratios in pure SVG/CSS, plots live pins on an SVG sector grid, and persists operational state to local storage.
- **Target Audience**: Disaster Response Unit (DRU) incident commanders, emergency call dispatchers, and field logistics coordinators managing fast-moving regional crises.
- **Key Value**: Eliminates dispatch latency, prevents over-allocation crashes through hard inventory locks, gives immediate visual clarity of resource bottlenecks, and maintains persistence across accidental browser refreshes.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Incident Call Intake**: Dispatcher enters caller location, distress type, risk level, required unit type, and situational notes. Submitting immediately logs the call with timestamp, plots a pulsing tactical pin onto the SVG grid, and positions the incident at the top of the prioritized triage feed.
2. **Resource Dispatch & Lock Prevention**:
   - Dispatcher inspects an incident card and clicks **Dispatch Unit**.
   - If corresponding inventory is available (>0), the unit is assigned to the incident, available count decrements, deployed count increments, and visual gauges recalculate.
   - If available units reach 0, the dispatch button dynamically disables with an alert badge (*"OUT OF RESOURCES"*), preventing catastrophic over-allocation.
3. **Incident Resolution**: Clicking **Mark Resolved** marks the emergency as stabilized, returns dispatched assets back into the active inventory pool, changes the map pin from pulsing red/amber to static green, and recalculates operational resolution percentage.
4. **Backup Force Requisition**: When resources run low, clicking **Call Backup Forces** opens a tactical reinforcement modal. Dispatchers select reinforcement packages (e.g. Paramedic Task Force +4, Water Rescue Boats +3, Heavy Cargo Copters +2), which immediately increments active inventory with audit logging.
5. **Search & Urgency Triage**: Dispatchers filter the feed using real-time search (by sector, caller street name, keyword) combined with urgency tabs (All, Critical, High, Moderate, Active, Resolved).
6. **Sector Map Interaction**: Hovering or clicking any SVG map pin highlights the matching incident card in the feed and displays a tooltip with triage status and caller needs.

### Visual Identity & Theme
- **Aesthetic Direction**: High-contrast, utilitarian tactical command center. Deep military/aero dark background with high-visibility neon semantic indicators (Crimson `#EF4444` for Critical, Amber `#F59E0B` for High, Emerald `#10B981` for Nominal/Resolved, Electric Cyan `#06B6D4` for Active Dispatches).
- **Color Palette**:
  - Dominant Neutral (60%): `#090D14` (Deep Night Command Canvas), `#111827` (Panel Surface), `#1F2937` (Borders & Dividers).
  - Structural Surface (30%): `#162032` (Card and Table Surfaces), `#24334A` (Hover States and Inset Wells).
  - High-Intent Accents (10%): `#EF4444` (Emergency Critical), `#3B82F6` (Command Dispatch), `#10B981` (All Clear / Ready), `#F59E0B` (Resource Warning).
- **Typography & Layout**:
  - Primary Sans: System UI / Modern Sans (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`) with high scannability.
  - Telemetry & Numerals: Monospace tabular numerals (`font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace; font-variant-numeric: tabular-nums`) for timestamps, resource counters, and percentages.
  - Zero-Pill Metadata Discipline: Clean unboxed metadata with dot separators (`Sector 4 · Flooding · 2 mins ago`).
  - Strict Top Bar Contract: Zone 1: Unified title wordmark (`DISPATCH-OPS // TACTICAL COMMAND`) — Zone 2: Sector and system status indicators — Zone 3: Active incident count and Call Backup Forces CTA.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Pure Vanilla Stack (No React, Tailwind, or External CDNs)**
  - *Chosen Approach*: Single standard `index.html`, modern responsive `style.css` (custom CSS variables, CSS grid, flexbox), and modular `scripts.js`.
  - *Why*: Satisfies all strict project constraints, produces lightning-fast load times with zero build overhead, and guarantees 100% offline availability in emergency disaster conditions.
- **Decision 2: Interactive SVG Tactical Map over Canvas or Static Mock**
  - *Chosen Approach*: Scalable Vector Graphics (SVG) with a coordinate sector grid (Sectors Alpha through Echo), geographic river/hazard overlays, and interactive `<circle>` and `<g>` pins with CSS keyframe pulse animations.
  - *Why*: Allows crisp vector scaling at any screen resolution, native DOM accessibility, declarative hover tooltips, and two-way click binding between map markers and incident feed cards.
- **Decision 3: Zero-Over-Allocation State Guard**
  - *Chosen Approach*: Deterministic resource validation logic executed on every dispatch request, checking both the specific vehicle category and overall fleet capacity before state mutation.
  - *Why*: Ensures physical inventory constraints are never violated in high-stress operational dispatch scenarios.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DISPATCH-OPS COMMAND DECK                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  TOP BAR: [DISPATCH-OPS DRU] ──── [Live Status & Filters] ── [Backup Forces] │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  LEFT COLUMN (40% width)             │  RIGHT COLUMN (60% width)            │
│  ┌────────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ 1. INCIDENT INTAKE FORM        │  │  │ 3. TACTICAL SECTOR MAP (SVG)   │  │
│  │  - Location & Sector           │  │  │  - Pulsing Sector Pins         │  │
│  │  - Severity & Incident Type    │  │  │  - Coords, Zones, & Hazards    │  │
│  │  - Required Units & Notes      │  │  └────────────────────────────────┘  │
│  │  - [LOG EMERGENCY CALL]        │  │  ┌────────────────────────────────┐  │
│  └────────────────────────────────┘  │  │ 4. RESOURCE INVENTORY & GAUGES │  │
│  ┌────────────────────────────────┐  │  │  - Paramedic Teams (Avail/Tot) │  │
│  │ 2. VANILLA METRIC VISUALIZERS  │  │  │  - Rescue Craft & 4x4s         │  │
│  │  - Active vs. Resolved Bar     │  │  │  - Cargo & Air Helicopters     │  │
│  │  - Fleet Deployment Ratio      │  │  │  - SVG Circular Gauge Charts   │  │
│  └────────────────────────────────┘  │  └────────────────────────────────┘  │
│                                      │  ┌────────────────────────────────┐  │
│                                      │  │ 5. LIVE INCIDENT FEED          │  │
│                                      │  │  - Keyword Search & Triage Tabs│  │
│                                      │  │  - Dispatch / Resolve Controls │  │
│                                      │  │  - Real-time Over-alloc Lock   │  │
│                                      │  └────────────────────────────────┘  │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │   LOCALSTORAGE STATE ENGINE  │
                   │  - incidents[]               │
                   │  - inventory { param, veh, } │
                   │  - auto-sync on every action │
                   └──────────────────────────────┘
```

### Data Model & State Specifications

```javascript
// State Schema
const AppState = {
  inventory: {
    paramedics: { available: 8, total: 10, name: "Paramedic Response Teams", icon: "med" },
    rescueVehicles: { available: 5, total: 7, name: "Amphibious & 4x4 Rescue Vehicles", icon: "veh" },
    heavyAirSupport: { available: 2, total: 3, name: "Supply Trucks & Helos", icon: "air" }
  },
  incidents: [
    {
      id: "INC-8021",
      callerName: "Marcus Vance",
      callerPhone: "555-0192",
      location: "Riverside District, Sector Alpha",
      sector: "Alpha",
      coordinates: { x: 120, y: 80 },
      severity: "critical", // "critical" | "high" | "moderate" | "low"
      needs: "paramedics",   // "paramedics" | "rescueVehicles" | "heavyAirSupport"
      details: "Rapid water ingress on lower levels. 4 civilians trapped on roof.",
      status: "active",     // "active" | "dispatched" | "resolved"
      dispatchedUnits: 0,
      timestamp: 1775302800000
    }
  ],
  filter: {
    keyword: "",
    urgency: "all" // "all" | "critical" | "high" | "moderate" | "active" | "resolved"
  }
};
```

### Interactive State Mappings & Validations
- `submitIncident(formData)`: Validates required inputs, generates unique `INC-XXXX` ID, calculates SVG sector coordinates, appends to `incidents` list, updates visual progress bars, and syncs `localStorage`.
- `dispatchResource(incidentId)`: Looks up incident's `needs` category; checks `inventory[category].available > 0`. If available, decrements inventory, increments incident's `dispatchedUnits`, transitions incident status from `active` to `dispatched`, updates map pin, and syncs storage. If 0, renders toast alert and locks button.
- `resolveIncident(incidentId)`: Returns all `dispatchedUnits` back into `inventory[category].available`, marks status `resolved`, disables dispatch, updates resolution metric bar, and persists state.
- `requestBackup(packageType)`: Adds designated units to both `available` and `total` counters in `inventory`, logs requisition event, closes modal, and refreshes UI.
- `filterIncidents()`: Evaluates search string against caller, location, needs, and notes, combined with urgency filter. Renders empty-state message if zero incidents match query.
- `resetScenario()`: Provides a quick reset button to restore default disaster state or clear cache.
