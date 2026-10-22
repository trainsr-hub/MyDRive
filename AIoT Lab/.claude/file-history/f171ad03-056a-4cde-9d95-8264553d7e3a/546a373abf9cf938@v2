// ECS 5-Tier State Management & Alert Evaluation Engine

// Tier 01: Static Lookup (Immutable Identity)
export const DEFAULT_STATIC = {
  stationId: "station_01",
  stationName: "Aegis Feeder Alpha",
};

// Tier 02: Append Log (Sensor Noises)
export const DEFAULT_SENSORS = {
  foodTank: 1850,       // grams
  waterTank: 2200,      // ml
  bowlFood: 45,         // grams
  bowlWater: 140,       // ml
  foodTankTemp: 23.5,   // °C
  foodTankMoisture: 48, // %RH
};

// Tier 03: User Progress (Stable Save State)
export const DEFAULT_PROGRESS = {
  autoFillWater: true,
  autoFillFood: true,
  status: "online", // "online" | "dispensing_food" | "dispensing_water" | "offline"
  lastFoodRefill: null,
  lastWaterRefill: null,
  lastUpdated: new Date().toISOString(),
};

// Tier 05: User Config (Configuration Parameters)
export const DEFAULT_CONFIG = {
  config: {
    tempMin: 16.0,
    tempMax: 28.0,
    moistureMax: 65.0,
    bowlWaterMin: 50,
    bowlWaterMax: 200,
    bowlFoodMin: 30,
    bowlFoodMax: 100,
  },
  capacities: {
    foodTank: 2500,
    waterTank: 3000,
    bowlFoodMaxLimit: 150,
    bowlWaterMaxLimit: 250,
  },
};

/**
 * Evaluates active alerts from ECS tier-separated data
 * @param {typeof DEFAULT_SENSORS} sensors - Tier 02 sensor readings
 * @param {typeof DEFAULT_PROGRESS} progress - Tier 03 user progress
 * @param {typeof DEFAULT_CONFIG} config - Tier 05 configuration
 * @returns {Array<{ id: string, type: string, title: string, message: string, timestamp: string, tier: string }>}
 */
export function evaluateAlerts(sensors, progress, config) {
  const alerts = [];
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const cfg = config.config;

  // Tier 02 Sensor Alerts
  if (sensors.foodTankTemp > cfg.tempMax) {
    alerts.push({
      id: "radical-temp-high",
      type: "critical",
      title: "Radical Temperature High",
      message: `Food tank temperature is ${sensors.foodTankTemp.toFixed(1)}°C, exceeding safe threshold of ${cfg.tempMax.toFixed(1)}°C. Food spoilage risk!`,
      timestamp: now,
      tier: "02_sensor",
    });
  } else if (sensors.foodTankTemp < cfg.tempMin) {
    alerts.push({
      id: "radical-temp-low",
      type: "warning",
      title: "Radical Temperature Low",
      message: `Food tank temperature dropped to ${sensors.foodTankTemp.toFixed(1)}°C (below minimum allowed ${cfg.tempMin.toFixed(1)}°C).`,
      timestamp: now,
      tier: "02_sensor",
    });
  }

  if (sensors.foodTankMoisture > cfg.moistureMax) {
    alerts.push({
      id: "radical-moisture",
      type: "critical",
      title: "Radical Moisture Detected",
      message: `Food tank moisture is ${sensors.foodTankMoisture.toFixed(1)}% RH (max safe limit is ${cfg.moistureMax.toFixed(1)}%). High risk of mold and kibble decay!`,
      timestamp: now,
      tier: "02_sensor",
    });
  }

  // Tier 03 User Progress + Tier 02 Sensor Cross-Tier Alerts
  if (!progress.autoFillWater && sensors.bowlWater <= cfg.bowlWaterMin) {
    alerts.push({
      id: "manual-refill-water",
      type: "action_required",
      title: "Water Bowl Depleted — Manual Refill Needed",
      message: `Water bowl has only ${Math.round(sensors.bowlWater)} ml (below min setpoint of ${cfg.bowlWaterMin} ml). Auto-fill is OFF. Please refill manually!`,
      timestamp: now,
      tier: "03_user_state",
    });
  }

  if (!progress.autoFillFood && sensors.bowlFood <= cfg.bowlFoodMin) {
    alerts.push({
      id: "manual-refill-food",
      type: "action_required",
      title: "Food Bowl Depleted — Manual Refill Needed",
      message: `Food bowl has only ${Math.round(sensors.bowlFood)} g (below min setpoint of ${cfg.bowlFoodMin} g). Auto-fill is OFF. Please refill manually!`,
      timestamp: now,
      tier: "03_user_state",
    });
  }

  // Tier 02 Tank Supply Warnings
  if (sensors.foodTank < 350) {
    alerts.push({
      id: "tank-food-low",
      type: "warning",
      title: "Food Tank Supply Running Low",
      message: `Main food reservoir has only ${Math.round(sensors.foodTank)} g remaining. Please restock bulk pet food.`,
      timestamp: now,
      tier: "02_sensor",
    });
  }

  if (sensors.waterTank < 450) {
    alerts.push({
      id: "tank-water-low",
      type: "warning",
      title: "Water Tank Supply Running Low",
      message: `Main water reservoir has only ${Math.round(sensors.waterTank)} ml remaining. Please refill the main water tank.`,
      timestamp: now,
      tier: "02_sensor",
    });
  }

  return alerts;
}
