# Firebase Task Board - ECS RTDB Architecture Redesign

**Project**: `firebase-task-board`  
**Database URL**: `https://manhattan-cafe-9fe21-default-rtdb.asia-southeast1.firebasedatabase.app`  
**Architecture**: Entity-Component System (ECS) 5-Tier Data Model  
**Analysis Date**: 2026-10-11

---

## Executive Summary

The current Firebase Task Board uses a **monolithic RTDB structure** that mixes static configuration, real-time telemetry, user state, and computed values in a single flat namespace. This redesign applies the Manager's ECS architecture to create a **5-tier separation** that isolates data by mutability, purpose, and access pattern.

### Current Problems
- All 24 fields mixed in single `pet_feeder/station_01/` path
- Client rehydrates entire state on every sensor reading
- Configuration mixed with telemetry mixed with user progress
- No clear separation between immutable design data and mutable state
- Alert computation happens client-side on every state change

### ECS Solution Benefits
- **Tier separation** by data lifecycle and access patterns
- **Reduced listener payload** — sensors write to tier 02 only
- **Configuration isolation** — user tweaks don't affect telemetry streams
- **Immutable design data** — station identity and capacities never change
- **Clear write patterns** — append-only sensors, atomic state saves

---

## ECS 5-Tier RTDB Structure

```
pet_feeder/
└── station_01/
    ├── 01_static_lookup/           # IMMUTABLE IDENTITY
    │   ├── stationId: "station_01"
    │   └── stationName: "Aegis Feeder Alpha"
    │
    ├── 02_append_log/              # SENSOR NOISES (append-only)
    │   ├── foodTank: 1850          # Current food reservoir level (g)
    │   ├── waterTank: 2200         # Current water reservoir level (ml)
    │   ├── bowlFood: 45            # Current food in bowl (g)
    │   ├── bowlWater: 140          # Current water in bowl (ml)
    │   ├── foodTankTemp: 23.5      # Food tank temperature (°C)
    │   └── foodTankMoisture: 48    # Food tank humidity (%RH)
    │
    ├── 03_user_progress/           # STABLE SAVE STATE
    │   ├── autoFillWater: true     # Automation toggle
    │   ├── autoFillFood: true      # Automation toggle
    │   ├── status: "online"        # Operational state
    │   ├── lastFoodRefill: "2026-10-11T10:55:00.000Z"
    │   ├── lastWaterRefill: "2026-10-11T11:00:30.000Z"
    │   └── lastUpdated: "2026-10-11T11:26:40.798Z"
    │
    └── 05_user_config/             # CONFIGURATION PARAMETERS
        ├── config/                 # Operational thresholds
        │   ├── tempMin: 16.0       # Minimum safe temperature (°C)
        │   ├── tempMax: 28.0       # Maximum safe temperature (°C)
        │   ├── moistureMax: 65.0   # Maximum safe humidity (%RH)
        │   ├── bowlWaterMin: 50    # Auto-fill trigger (ml)
        │   ├── bowlWaterMax: 200   # Target bowl capacity (ml)
        │   ├── bowlFoodMin: 30     # Auto-fill trigger (g)
        │   └── bowlFoodMax: 100    # Target bowl capacity (g)
        └── capacities/             # Physical hardware limits
            ├── foodTank: 2500      # Main tank max capacity (g)
            ├── waterTank: 3000     # Main tank max capacity (ml)
            ├── bowlFoodMaxLimit: 150   # Physical bowl limit (g)
            └── bowlWaterMaxLimit: 250  # Physical bowl limit (ml)
```

---

## Tier Definitions & Data Lifecycle

### 01_static_lookup — Immutable Identity
**Purpose**: Station identification that NEVER changes  
**Write Pattern**: Set once during station commissioning, never modified  
**Read Pattern**: Loaded once on UI boot, cached indefinitely  

| Field | Type | Example | Lifecycle |
|-------|------|---------|-----------|
| `stationId` | String | `"station_01"` | Set once, never changes |
| `stationName` | String | `"Aegis Feeder Alpha"` | User-editable display name |

### 02_append_log — Sensor Noises (Real-time Telemetry)
**Purpose**: All sensor readings — "bunches of noises"  
**Write Pattern**: Overwrite/append fresh sensor values every 6 seconds  
**Read Pattern**: High-frequency listener, drives UI live updates  

| Field | Type | Unit | Range | Update Frequency |
|-------|------|------|-------|------------------|
| `foodTank` | Number | grams | [0, 2500] | Every sensor poll (~6s) |
| `waterTank` | Number | ml | [0, 3000] | Every sensor poll (~6s) |
| `bowlFood` | Number | grams | [0, 150] | Every sensor poll (~6s) |
| `bowlWater` | Number | ml | [0, 250] | Every sensor poll (~6s) |
| `foodTankTemp` | Number | °C | [-10, 50] | Every sensor poll (~6s) |
| `foodTankMoisture` | Number | %RH | [0, 100] | Every sensor poll (~6s) |

**Key Insight**: These are append-only in the sense that **you never modify a previous reading** — you only write the **latest sensor snapshot**. No historical versioning needed at the database level.

### 03_user_progress — Stable Save State
**Purpose**: User automation settings and operation history  
**Write Pattern**: Atomic updates when user changes settings or system performs actions  
**Read Pattern**: Loaded on boot, low-frequency updates  

| Field | Type | Example | Trigger |
|-------|------|---------|---------|
| `autoFillWater` | Boolean | `true` | User toggle |
| `autoFillFood` | Boolean | `true` | User toggle |
| `status` | String | `"online"` | System state change |
| `lastFoodRefill` | Timestamp | `"2026-10-11T10:55:00.000Z"` | Manual/auto dispense |
| `lastWaterRefill` | Timestamp | `"2026-10-11T11:00:30.000Z"` | Manual/auto dispense |
| `lastUpdated` | Timestamp | `"2026-10-11T11:26:40.798Z"` | Any state mutation |

**Key Insight**: This is the "game save" — the state that must survive across sessions and represents the user's intentional configuration.

### 04_display — SKIPPED
**Rationale**: Manager determined this tier is not needed. Alerts remain computed client-side from tiers 02, 03, and 05.

### 05_user_config — Configuration Parameters  
**Purpose**: User-tunable thresholds and immutable hardware specifications  
**Write Pattern**: Full replacement when user saves configuration form  
**Read Pattern**: Loaded once on boot, infrequent updates  

#### config/ — Operational Thresholds
| Field | Type | Unit | Default | Purpose |
|-------|------|------|---------|---------|
| `tempMin` | Number | °C | 16.0 | Alert threshold |
| `tempMax` | Number | °C | 28.0 | Alert threshold |
| `moistureMax` | Number | %RH | 65.0 | Alert threshold |
| `bowlWaterMin` | Number | ml | 50 | Auto-fill trigger |
| `bowlWaterMax` | Number | ml | 200 | Auto-fill target |
| `bowlFoodMin` | Number | g | 30 | Auto-fill trigger |
| `bowlFoodMax` | Number | g | 100 | Auto-fill target |

#### capacities/ — Hardware Specifications
| Field | Type | Unit | Value | Purpose |
|-------|------|------|-------|---------|
| `foodTank` | Number | g | 2500 | Physical tank limit |
| `waterTank` | Number | ml | 3000 | Physical tank limit |
| `bowlFoodMaxLimit` | Number | g | 150 | Physical bowl limit |
| `bowlWaterMaxLimit` | Number | ml | 250 | Physical bowl limit |

**Key Insight**: Capacities belong in user_config (tier 05) not static_lookup (tier 01) because different hardware revisions may have different tank sizes. They're immutable per installation but not per design.

---

## Firebase Listener Strategy

### Current (Monolithic)
```javascript
// Single massive listener on entire state
const dbRef = ref(rtdb, 'pet_feeder/station_01');
onValue(dbRef, (snapshot) => {
  // Full 24-field rehydration on every sensor tick
  this.state = { ...DEFAULT_STATE, ...snapshot.val() };
});
```

### ECS Multi-Tier Listeners
```javascript
// Tier 01: Load once, never changes
const staticRef = ref(rtdb, 'pet_feeder/station_01/01_static_lookup');
const staticSnapshot = await get(staticRef);
this.staticData = staticSnapshot.val();

// Tier 02: High-frequency sensor stream
const sensorRef = ref(rtdb, 'pet_feeder/station_01/02_append_log');
onValue(sensorRef, (snapshot) => {
  this.sensors = snapshot.val();  // Only 6 fields, high frequency
  this.computeAlertsAndNotify();
});

// Tier 03: User progress changes
const progressRef = ref(rtdb, 'pet_feeder/station_01/03_user_progress');
onValue(progressRef, (snapshot) => {
  this.userProgress = snapshot.val();  // Only 6 fields, low frequency
  this.computeAlertsAndNotify();
});

// Tier 05: Config changes (very rare)
const configRef = ref(rtdb, 'pet_feeder/station_01/05_user_config');
onValue(configRef, (snapshot) => {
  this.config = snapshot.val();  // Only when user saves
  this.computeAlertsAndNotify();
});
```

**Benefits**:
- **Reduced sensor payload**: 6 telemetry fields instead of 24 mixed fields
- **Targeted updates**: UI only re-renders affected sections
- **Bandwidth optimization**: Configuration changes don't re-send sensor data
- **Cache efficiency**: Static data loaded once, never retransmitted

---

## Write Operation Patterns

### Sensor Updates (02_append_log)
```javascript
// IoT device or simulator writes fresh sensor readings
await update(ref(rtdb, 'pet_feeder/station_01/02_append_log'), {
  foodTank: 1820,
  waterTank: 2150,
  bowlFood: 42,
  bowlWater: 138,
  foodTankTemp: 23.7,
  foodTankMoisture: 47.2
});
```

### User Action (03_user_progress)
```javascript
// User toggles auto-fill or system performs dispense
await update(ref(rtdb, 'pet_feeder/station_01/03_user_progress'), {
  autoFillWater: false,
  lastUpdated: new Date().toISOString()
});
```

### Configuration Save (05_user_config)
```javascript
// User submits config form
await set(ref(rtdb, 'pet_feeder/station_01/05_user_config'), {
  config: {
    tempMin: 15.0,
    tempMax: 30.0,
    moistureMax: 70.0,
    bowlWaterMin: 40,
    bowlWaterMax: 220,
    bowlFoodMin: 25,
    bowlFoodMax: 110
  },
  capacities: { /* unchanged */ }
});
```

---

## Multi-Station Scaling

### Current Limitation
```
pet_feeder/
└── station_01/  ← Hardcoded single station
```

### ECS Multi-Station Architecture
```
pet_feeder/
├── stations/
│   ├── station_01/
│   │   ├── 01_static_lookup/
│   │   ├── 02_append_log/
│   │   ├── 03_user_progress/
│   │   └── 05_user_config/
│   ├── station_02/
│   │   ├── 01_static_lookup/
│   │   ├── 02_append_log/
│   │   ├── 03_user_progress/
│   │   └── 05_user_config/
│   └── station_N...
└── metadata/
    ├── lastSyncTime: "2026-10-11T11:26:40.798Z"
    ├── version: "1.0.0"
    └── activeStations: ["station_01", "station_02"]
```

**Code Changes Required**:
1. Update `feederService.connectStation(stationId)` to accept dynamic station ID
2. Add station selector UI component
3. Modify RTDB paths from `pet_feeder/station_01/` to `pet_feeder/stations/${stationId}/`
4. Update listeners to re-subscribe on station change

---

## Alert System Architecture

### Current (Client-Side Computation)
```javascript
// evaluateAlerts() called on every state change
function evaluateAlerts(state) {
  const alerts = [];
  if (state.foodTankTemp > state.config.tempMax) {
    alerts.push({ id: "radical-temp-high", type: "critical", ... });
  }
  // ... 7 total alert conditions
  return alerts;
}
```

### ECS Alert Computation (Enhanced)
```javascript
// Computed from multiple tiers
function evaluateAlerts(sensors, userProgress, config) {
  const alerts = [];
  
  // Sensor-based alerts (from tier 02)
  if (sensors.foodTankTemp > config.config.tempMax) {
    alerts.push({
      id: "radical-temp-high",
      type: "critical",
      title: "Radical Temperature High",
      message: `${sensors.foodTankTemp.toFixed(1)}°C exceeds safe threshold`,
      tier: "02_sensor",
      timestamp: new Date().toISOString()
    });
  }
  
  // State-based alerts (from tier 03)
  if (!userProgress.autoFillWater && sensors.bowlWater <= config.config.bowlWaterMin) {
    alerts.push({
      id: "manual-refill-water",
      type: "action_required", 
      title: "Water Bowl Depleted — Manual Refill Needed",
      message: `Auto-fill is OFF. ${sensors.bowlWater}ml < ${config.config.bowlWaterMin}ml`,
      tier: "03_user_state",
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
}
```

**Alert Metadata Enhancement**: Each alert now includes:
- **tier**: Which ECS tier triggered the alert
- **timestamp**: When the alert was computed
- **Cleaner separation**: Sensor alerts vs. configuration alerts vs. user-state alerts

---

## Migration Strategy

### Phase 1: Dual-Write Compatibility
```javascript
// Write to both old and new structures during transition
async function dualWrite(sensorData) {
  // Legacy write (existing structure)
  await update(ref(rtdb, 'pet_feeder/station_01'), {
    foodTank: sensorData.foodTank,
    waterTank: sensorData.waterTank,
    // ... all 24 fields
  });
  
  // ECS write (new structure)
  await update(ref(rtdb, 'pet_feeder/station_01/02_append_log'), {
    foodTank: sensorData.foodTank,
    waterTank: sensorData.waterTank,
    bowlFood: sensorData.bowlFood,
    bowlWater: sensorData.bowlWater,
    foodTankTemp: sensorData.foodTankTemp,
    foodTankMoisture: sensorData.foodTankMoisture
  });
}
```

### Phase 2: ECS Listener Migration  
```javascript
// Switch UI to ECS listeners while maintaining legacy fallback
const useECSStructure = true;  // Feature flag
if (useECSStructure) {
  // Multi-tier listeners
  this.connectECSListeners(stationId);
} else {
  // Legacy single listener
  this.connectLegacyListener(stationId);
}
```

### Phase 3: Legacy Cleanup
- Remove old `pet_feeder/station_01/*` flat structure
- Remove dual-write logic  
- Update security rules to match new paths
- Archive old data structure documentation

---

## RTDB Security Rules (ECS-Aware)

### Current Rules Issue
```
RTDB restricted. Set RTDB rules to {".read": true, ".write": true}
```

### Proposed ECS Security Rules
```json
{
  "rules": {
    "pet_feeder": {
      "stations": {
        "$stationId": {
          "01_static_lookup": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == 'admin'"
          },
          "02_append_log": {
            ".read": "auth != null", 
            ".write": "auth != null"
          },
          "03_user_progress": {
            ".read": "auth != null",
            ".write": "auth != null"
          },
          "05_user_config": {
            ".read": "auth != null",
            ".write": "auth != null"
          }
        }
      }
    }
  }
}
```

**Security Benefits**:
- **01_static_lookup**: Admin-only writes (station commissioning)
- **02_append_log**: IoT device + authenticated users (sensor data)
- **03_user_progress**: Authenticated users (automation settings)
- **05_user_config**: Authenticated users (configuration changes)

---

## Performance Impact Analysis

### Current Monolithic Structure
| Metric | Current Value | Issues |
|--------|---------------|--------|
| Listener Payload | ~4KB (24 fields) | Full rehydration every sensor update |
| Update Frequency | Every 6s (IoT sim) | All listeners fire on every change |
| Alert Computation | Every state change | 7 alert rules × every sensor tick |
| Network Efficiency | Low | Config retransmitted with sensors |

### ECS Structure Benefits  
| Metric | ECS Value | Improvement |
|--------|-----------|-------------|
| Sensor Payload | ~1.5KB (6 fields) | 62% reduction in sensor update size |
| Config Payload | ~0.8KB (11 fields) | Transmitted only when user saves |
| Static Payload | ~0.2KB (2 fields) | Loaded once, cached indefinitely |
| Cache Hit Ratio | ~85% | Static + config rarely change |
| Alert Computation | Targeted to changed tier | Fewer false recalculations |

### Bandwidth Savings (Daily)
```
Current: 4KB × 14,400 updates/day (every 6s) = 57.6MB/day per station
ECS Sensors: 1.5KB × 14,400 updates/day = 21.6MB/day per station
ECS Config: 0.8KB × 5 config changes/day = 4KB/day per station
ECS Static: 0.2KB × 1 load/day = 0.2KB/day per station

Total ECS: 21.6MB/day (62% reduction)
```

---

## Implementation Checklist

### Code Changes Required

#### feeder-service.js
- [ ] Split `connectStation()` into 4 separate listeners
- [ ] Update `persistState()` to write to appropriate tiers
- [ ] Modify alert evaluation to accept tier-separated data
- [ ] Add tier-aware error handling and fallbacks

#### state.js  
- [ ] Split `DEFAULT_STATE` into tier-specific defaults
- [ ] Update `evaluateAlerts()` to accept tier-separated parameters
- [ ] Add tier metadata to alert objects

#### main.js
- [ ] Update DOM event handlers for tier-aware writes
- [ ] Modify form submission to target `05_user_config`
- [ ] Update sensor simulation to target `02_append_log`

#### ui-renderer.js
- [ ] Update rendering functions to consume tier-separated data
- [ ] Add tier-aware error state displays
- [ ] Implement tier-specific loading states

### Database Migration
- [ ] Create migration script to split existing data into tiers
- [ ] Implement dual-write compatibility mode  
- [ ] Update Firebase security rules for new path structure
- [ ] Test tier-isolated read/write permissions

### Testing & Validation
- [ ] Unit tests for tier-specific data operations
- [ ] Integration tests for multi-listener coordination
- [ ] Load testing with simulated sensor data streams
- [ ] Compatibility testing with existing IoT hardware

---

## Conclusion

The ECS 5-tier RTDB architecture transforms the monolithic Firebase structure into a **performance-optimized, scalable, and maintainable** data model. By separating concerns across tiers, we achieve:

1. **62% reduction** in sensor update payload size
2. **Clear data lifecycle management** with tier-specific write patterns
3. **Multi-station scalability** without architectural changes
4. **Enhanced security** with tier-specific access controls
5. **Improved cache efficiency** through tier-isolated listeners

This redesign positions the Firebase Task Board for **enterprise-scale deployment** while maintaining the simplicity of the current single-station proof-of-concept.

**Next Steps**: Begin implementation with Phase 1 dual-write compatibility, allowing gradual migration while maintaining backward compatibility with existing deployments.

---

**Document Version**: 1.0  
**Author**: Faust (Strategic Architect)  
**Manager Approval**: Pending