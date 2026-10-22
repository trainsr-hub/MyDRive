// Feeder Service: ECS 5-Tier Firebase RTDB Sync, Command Dispatch, and IoT Simulator
import { rtdb, ref, onValue, set, update, get } from "./firebase.js";
import {
  DEFAULT_STATIC,
  DEFAULT_SENSORS,
  DEFAULT_PROGRESS,
  DEFAULT_CONFIG,
  evaluateAlerts
} from "./state.js";

class FeederService {
  constructor() {
    this.stationId = "station_01";
    this.basePath = `pet_feeder/station_01`;

    // ECS Tier Data
    this.staticData = { ...DEFAULT_STATIC };
    this.sensors = { ...DEFAULT_SENSORS };
    this.progress = { ...DEFAULT_PROGRESS };
    this.config = { ...DEFAULT_CONFIG };

    // Subscribers & State
    this.subscribers = new Set();
    this.logs = [];
    this.unsubscribers = { static: null, sensors: null, progress: null, config: null };
    this.isUsingLocalFallback = false;
    this.simTimer = null;
    this.isSimulating = false;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getFullState(), this.logs, evaluateAlerts(this.sensors, this.progress, this.config));
    return () => this.subscribers.delete(callback);
  }

  getFullState() {
    return {
      ...this.staticData,
      ...this.sensors,
      ...this.progress,
      config: this.config.config,
      capacities: this.config.capacities,
    };
  }

  notify() {
    const alerts = evaluateAlerts(this.sensors, this.progress, this.config);
    for (const sub of this.subscribers) {
      sub(this.getFullState(), this.logs, alerts);
    }
  }

  logActivity(message, type = "info") {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.unshift({ id: `${Date.now()}-${Math.random()}`, message, type, time });
    if (this.logs.length > 30) this.logs.pop();
  }

  /**
   * Unsubscribe from all RTDB listeners
   */
  disconnectAllListeners() {
    if (this.unsubscribers.static) this.unsubscribers.static();
    if (this.unsubscribers.sensors) this.unsubscribers.sensors();
    if (this.unsubscribers.progress) this.unsubscribers.progress();
    if (this.unsubscribers.config) this.unsubscribers.config();
    this.unsubscribers = { static: null, sensors: null, progress: null, config: null };
  }

  /**
   * Initialize 5-tier ECS RTDB listeners
   */
  async connectStation(stationId = "station_01") {
    this.stationId = stationId;
    this.basePath = `pet_feeder/${stationId}`;

    // Disconnect existing listeners
    this.disconnectAllListeners();

    try {
      // TIER 01: Static Lookup (Immutable Identity) — Load Once
      await this.initTier01Static();

      // TIER 02: Append Log (Sensor Noises) — High Frequency
      this.initTier02Sensors();

      // TIER 03: User Progress (Stable Save State) — Low Frequency
      this.initTier03Progress();

      // TIER 05: User Config (Configuration Parameters) — Very Low Frequency
      this.initTier05Config();

      this.logActivity(`Connected to ECS RTDB structure at [${this.basePath}]`, "info");
      this.notify();
    } catch (err) {
      console.warn("[FeederService] Failed to establish RTDB connection:", err);
      this.isUsingLocalFallback = true;
      this.notify();
    }
  }

  /**
   * Tier 01: Static Lookup — Load once, never changes
   */
  async initTier01Static() {
    const tier01Ref = ref(rtdb, `${this.basePath}/01_static_lookup`);
    try {
      const snapshot = await get(tier01Ref);
      if (snapshot.exists()) {
        this.staticData = snapshot.val();
      } else {
        this.logActivity(`Initializing Tier 01 Static Lookup at [${this.basePath}/01_static_lookup]...`, "info");
        await set(tier01Ref, DEFAULT_STATIC);
        this.staticData = DEFAULT_STATIC;
      }
    } catch (err) {
      console.warn("[FeederService] Tier 01 read failed:", err);
      this.isUsingLocalFallback = true;
    }
  }

  /**
   * Tier 02: Append Log (Sensor Noises) — High-frequency listener
   */
  initTier02Sensors() {
    const tier02Ref = ref(rtdb, `${this.basePath}/02_append_log`);
    this.unsubscribers.sensors = onValue(
      tier02Ref,
      (snapshot) => {
        if (snapshot.exists()) {
          this.sensors = { ...DEFAULT_SENSORS, ...snapshot.val() };
          this.isUsingLocalFallback = false;
          this.checkAutoRefillRules();
          this.notify();
        } else {
          this.logActivity(`Initializing Tier 02 Sensors at [${this.basePath}/02_append_log]...`, "info");
          set(tier02Ref, DEFAULT_SENSORS).catch(err => {
            console.warn("[FeederService] Tier 02 seed write failed:", err);
          });
        }
      },
      (error) => {
        console.warn("[FeederService] Tier 02 listener error:", error);
        this.isUsingLocalFallback = true;
        this.logActivity(`Tier 02 sensor stream ${error.code || "restricted"}. Check RTDB rules.`, "warning");
        this.notify();
      }
    );
  }

  /**
   * Tier 03: User Progress — Low-frequency listener
   */
  initTier03Progress() {
    const tier03Ref = ref(rtdb, `${this.basePath}/03_user_progress`);
    this.unsubscribers.progress = onValue(
      tier03Ref,
      (snapshot) => {
        if (snapshot.exists()) {
          this.progress = { ...DEFAULT_PROGRESS, ...snapshot.val() };
          this.isUsingLocalFallback = false;
          this.checkAutoRefillRules();
          this.notify();
        } else {
          this.logActivity(`Initializing Tier 03 User Progress at [${this.basePath}/03_user_progress]...`, "info");
          set(tier03Ref, DEFAULT_PROGRESS).catch(err => {
            console.warn("[FeederService] Tier 03 seed write failed:", err);
          });
        }
      },
      (error) => {
        console.warn("[FeederService] Tier 03 listener error:", error);
        this.isUsingLocalFallback = true;
      }
    );
  }

  /**
   * Tier 05: User Config — Very low-frequency listener
   */
  initTier05Config() {
    const tier05Ref = ref(rtdb, `${this.basePath}/05_user_config`);
    this.unsubscribers.config = onValue(
      tier05Ref,
      (snapshot) => {
        if (snapshot.exists()) {
          this.config = { ...DEFAULT_CONFIG, ...snapshot.val() };
          this.isUsingLocalFallback = false;
          this.checkAutoRefillRules();
          this.notify();
        } else {
          this.logActivity(`Initializing Tier 05 User Config at [${this.basePath}/05_user_config]...`, "info");
          set(tier05Ref, DEFAULT_CONFIG).catch(err => {
            console.warn("[FeederService] Tier 05 seed write failed:", err);
          });
        }
      },
      (error) => {
        console.warn("[FeederService] Tier 05 listener error:", error);
        this.isUsingLocalFallback = true;
      }
    );
  }

  /**
   * Persist changes to Tier 02 (Sensors)
   */
  async persistSensors(partialSensors, logMsg, logType = "info") {
    this.sensors = { ...this.sensors, ...partialSensors };
    if (logMsg) this.logActivity(logMsg, logType);
    this.checkAutoRefillRules();
    this.notify();

    if (!this.isUsingLocalFallback) {
      try {
        const tier02Ref = ref(rtdb, `${this.basePath}/02_append_log`);
        await update(tier02Ref, partialSensors);
      } catch (err) {
        console.warn("[FeederService] Tier 02 write failed:", err);
      }
    }
  }

  /**
   * Persist changes to Tier 03 (User Progress)
   */
  async persistProgress(partialProgress, logMsg, logType = "info") {
    this.progress = {
      ...this.progress,
      ...partialProgress,
      lastUpdated: new Date().toISOString(),
    };
    if (logMsg) this.logActivity(logMsg, logType);
    this.checkAutoRefillRules();
    this.notify();

    if (!this.isUsingLocalFallback) {
      try {
        const tier03Ref = ref(rtdb, `${this.basePath}/03_user_progress`);
        await update(tier03Ref, { ...partialProgress, lastUpdated: this.progress.lastUpdated });
      } catch (err) {
        console.warn("[FeederService] Tier 03 write failed:", err);
      }
    }
  }

  /**
   * Persist changes to Tier 05 (User Config) — Full replacement
   */
  async persistConfig(newConfig, logMsg, logType = "info") {
    this.config = newConfig;
    if (logMsg) this.logActivity(logMsg, logType);
    this.checkAutoRefillRules();
    this.notify();

    if (!this.isUsingLocalFallback) {
      try {
        const tier05Ref = ref(rtdb, `${this.basePath}/05_user_config`);
        await set(tier05Ref, newConfig);
      } catch (err) {
        console.warn("[FeederService] Tier 05 write failed:", err);
      }
    }
  }

  // ========== ACTIVE COMMANDS ==========

  async refillWaterManual(amount = 50) {
    if (this.sensors.waterTank < amount) {
      this.logActivity(`Cannot refill water: Tank empty (${Math.round(this.sensors.waterTank)} ml)!`, "warning");
      return;
    }
    const maxBowl = this.config.config.bowlWaterMax;
    const current = this.sensors.bowlWater;
    const add = Math.min(amount, Math.max(0, maxBowl - current));
    if (add <= 0) {
      this.logActivity(`Water bowl is already at or above max capacity (${maxBowl} ml).`, "info");
      return;
    }

    const newWaterTank = Math.max(0, this.sensors.waterTank - add);
    const newBowlWater = current + add;

    await this.persistSensors(
      {
        waterTank: newWaterTank,
        bowlWater: newBowlWater,
      },
      `Manually dispensed ${add} ml water into bowl.`,
      "info"
    );

    await this.persistProgress({ status: "dispensing_water", lastWaterRefill: new Date().toISOString() });

    setTimeout(() => {
      this.persistProgress({ status: "online" });
    }, 1200);
  }

  async refillFoodManual(amount = 25) {
    if (this.sensors.foodTank < amount) {
      this.logActivity(`Cannot refill food: Tank empty (${Math.round(this.sensors.foodTank)} g)!`, "warning");
      return;
    }
    const maxBowl = this.config.config.bowlFoodMax;
    const current = this.sensors.bowlFood;
    const add = Math.min(amount, Math.max(0, maxBowl - current));
    if (add <= 0) {
      this.logActivity(`Food bowl is already at or above max capacity (${maxBowl} g).`, "info");
      return;
    }

    const newFoodTank = Math.max(0, this.sensors.foodTank - add);
    const newBowlFood = current + add;

    await this.persistSensors(
      {
        foodTank: newFoodTank,
        bowlFood: newBowlFood,
      },
      `Manually dispensed ${add} g pet food into bowl.`,
      "info"
    );

    await this.persistProgress({ status: "dispensing_food", lastFoodRefill: new Date().toISOString() });

    setTimeout(() => {
      this.persistProgress({ status: "online" });
    }, 1200);
  }

  async toggleAutoWater(enabled) {
    await this.persistProgress(
      { autoFillWater: enabled },
      `Auto-fill Water switched ${enabled ? "ON" : "OFF"}.`,
      enabled ? "info" : "warning"
    );
  }

  async toggleAutoFood(enabled) {
    await this.persistProgress(
      { autoFillFood: enabled },
      `Auto-fill Food switched ${enabled ? "ON" : "OFF"}.`,
      enabled ? "info" : "warning"
    );
  }

  async updateConfig(newConfig) {
    const updated = {
      config: { ...this.config.config, ...newConfig },
      capacities: this.config.capacities
    };
    await this.persistConfig(updated, "Updated feeder configuration thresholds and limits.", "info");
  }

  async restockBulkTank(tankType) {
    if (tankType === "food") {
      const cap = this.config.capacities.foodTank;
      await this.persistSensors({ foodTank: cap }, `Restocked Food Tank to full capacity (${cap} g).`, "info");
    } else if (tankType === "water") {
      const cap = this.config.capacities.waterTank;
      await this.persistSensors({ waterTank: cap }, `Restocked Water Tank to full capacity (${cap} ml).`, "info");
    }
  }

  // ========== AUTOMATIC REFILL LOGIC ==========

  checkAutoRefillRules() {
    const { bowlWater, bowlFood } = this.sensors;
    const { autoFillWater, autoFillFood } = this.progress;
    const cfg = this.config.config;
    const { waterTank, foodTank } = this.sensors;

    if (autoFillWater && bowlWater <= cfg.bowlWaterMin && waterTank > 20) {
      const need = cfg.bowlWaterMax - bowlWater;
      const actual = Math.min(need, waterTank);
      if (actual > 0) {
        this.sensors.waterTank -= actual;
        this.sensors.bowlWater += actual;
        this.logActivity(`[AUTO-FILL] Dispensed ${Math.round(actual)} ml water (triggered at ${Math.round(bowlWater)} ml <= min ${cfg.bowlWaterMin} ml).`, "info");
      }
    }

    if (autoFillFood && bowlFood <= cfg.bowlFoodMin && foodTank > 10) {
      const need = cfg.bowlFoodMax - bowlFood;
      const actual = Math.min(need, foodTank);
      if (actual > 0) {
        this.sensors.foodTank -= actual;
        this.sensors.bowlFood += actual;
        this.logActivity(`[AUTO-FILL] Dispensed ${Math.round(actual)} g food (triggered at ${Math.round(bowlFood)} g <= min ${cfg.bowlFoodMin} g).`, "info");
      }
    }
  }

  // ========== IoT SIMULATION & TESTING ==========

  toggleSimulation(enable) {
    this.isSimulating = enable;
    if (enable) {
      if (this.simTimer) clearInterval(this.simTimer);
      this.simTimer = setInterval(() => this.runSimulationTick(), 6000);
      this.logActivity("IoT Hardware Simulation started (6s autonomous cycles).", "info");
    } else {
      if (this.simTimer) clearInterval(this.simTimer);
      this.simTimer = null;
      this.logActivity("IoT Hardware Simulation stopped.", "info");
    }
    this.notify();
  }

  runSimulationTick() {
    const petAction = Math.random();
    let updated = false;

    if (petAction < 0.4 && this.sensors.bowlFood > 5) {
      const eaten = Math.min(this.sensors.bowlFood, Math.floor(Math.random() * 8) + 4);
      this.sensors.bowlFood = Math.max(0, this.sensors.bowlFood - eaten);
      this.logActivity(`🐾 Pet visited: consumed ${eaten} g food.`, "info");
      updated = true;
    } else if (petAction < 0.8 && this.sensors.bowlWater > 10) {
      const drank = Math.min(this.sensors.bowlWater, Math.floor(Math.random() * 15) + 8);
      this.sensors.bowlWater = Math.max(0, this.sensors.bowlWater - drank);
      this.logActivity(`🐾 Pet visited: drank ${drank} ml water.`, "info");
      updated = true;
    }

    const tempJitter = (Math.random() - 0.5) * 0.4;
    const moistJitter = (Math.random() - 0.5) * 0.8;
    this.sensors.foodTankTemp = Math.round((this.sensors.foodTankTemp + tempJitter) * 10) / 10;
    this.sensors.foodTankMoisture = Math.round((this.sensors.foodTankMoisture + moistJitter) * 10) / 10;

    this.checkAutoRefillRules();
    this.notify();
    this.persistSensors({
      bowlFood: this.sensors.bowlFood,
      bowlWater: this.sensors.bowlWater,
      foodTankTemp: this.sensors.foodTankTemp,
      foodTankMoisture: this.sensors.foodTankMoisture,
    });
  }

  triggerRadicalSpike(type) {
    if (type === "temp_high") {
      this.persistSensors({ foodTankTemp: 32.8 }, "Simulated sudden heatwave spike: 32.8°C", "warning");
    } else if (type === "temp_low") {
      this.persistSensors({ foodTankTemp: 13.5 }, "Simulated severe drop in temperature: 13.5°C", "warning");
    } else if (type === "moisture_high") {
      this.persistSensors({ foodTankMoisture: 78.4 }, "Simulated severe moisture spike: 78.4% RH", "warning");
    } else if (type === "normalize") {
      this.persistSensors({ foodTankTemp: 23.5, foodTankMoisture: 48.0 }, "Normalized temperature and moisture to nominal levels.", "info");
    }
  }
}

export const feederService = new FeederService();
