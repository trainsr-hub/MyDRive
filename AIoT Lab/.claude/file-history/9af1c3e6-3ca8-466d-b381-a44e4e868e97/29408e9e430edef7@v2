import "./style.css";
import { feederService } from "./feeder-service.js";
import {
  auth,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
  logoutUser,
  onAuthStateChanged,
} from "./firebase.js";
import {
  renderAlerts,
  renderTelemetry,
  populateConfigForm,
  renderLogs,
} from "./ui-renderer.js";

// DOM References
const elements = {
  // Alerts & Logs
  alertsContainer: document.querySelector("#alerts-container"),
  logList: document.querySelector("#log-list"),
  statusBadge: document.querySelector("#status-badge"),
  lastUpdatedVal: document.querySelector("#last-updated-val"),

  // Tanks
  foodTankVal: document.querySelector("#food-tank-val"),
  foodTankSub: document.querySelector("#food-tank-sub"),
  foodTankBar: document.querySelector("#food-tank-bar"),
  waterTankVal: document.querySelector("#water-tank-val"),
  waterTankSub: document.querySelector("#water-tank-sub"),
  waterTankBar: document.querySelector("#water-tank-bar"),

  // Bowls
  bowlFoodVal: document.querySelector("#bowl-food-val"),
  bowlFoodSub: document.querySelector("#bowl-food-sub"),
  bowlFoodBar: document.querySelector("#bowl-food-bar"),
  bowlFoodStatus: document.querySelector("#bowl-food-status"),

  bowlWaterVal: document.querySelector("#bowl-water-val"),
  bowlWaterSub: document.querySelector("#bowl-water-sub"),
  bowlWaterBar: document.querySelector("#bowl-water-bar"),
  bowlWaterStatus: document.querySelector("#bowl-water-status"),

  // Climate
  tempVal: document.querySelector("#temp-val"),
  moistureVal: document.querySelector("#moisture-val"),
  climateRange: document.querySelector("#climate-range"),
  tempStatus: document.querySelector("#temp-status"),
  moistureStatus: document.querySelector("#moisture-status"),

  // Controls & Toggles
  autoFoodToggle: document.querySelector("#auto-food-toggle"),
  autoWaterToggle: document.querySelector("#auto-water-toggle"),
};

// Buttons & Forms
const refillFoodManualBtn = document.querySelector("#refill-food-manual-btn");
const refillWaterManualBtn = document.querySelector("#refill-water-manual-btn");
const restockFoodBtn = document.querySelector("#restock-food-btn");
const restockWaterBtn = document.querySelector("#restock-water-btn");

const testHeatBtn = document.querySelector("#test-heat-btn");
const testMoistBtn = document.querySelector("#test-moist-btn");
const testNormBtn = document.querySelector("#test-norm-btn");

const configForm = document.querySelector("#config-form");
const simToggle = document.querySelector("#sim-toggle");
const themeBtn = document.querySelector("#theme-btn");

// Auth Elements
const userDisplay = document.querySelector("#user-display");
const authActionBtn = document.querySelector("#auth-action-btn");
const authModal = document.querySelector("#auth-modal");
const modalCloseBtn = document.querySelector("#modal-close-btn");
const modalAuthForm = document.querySelector("#modal-auth-form");
const modalEmail = document.querySelector("#modal-email");
const modalPassword = document.querySelector("#modal-password");
const modalSignupBtn = document.querySelector("#modal-signup-btn");
const modalAnonBtn = document.querySelector("#modal-anon-btn");
const modalAuthMsg = document.querySelector("#modal-auth-msg");

let isFormInitialized = false;

// 1. Subscribe to Feeder Service State
feederService.subscribe((state, logs, alerts) => {
  renderAlerts(elements.alertsContainer, alerts);
  renderTelemetry(state, elements);
  renderLogs(elements.logList, logs);

  if (!isFormInitialized && state.config) {
    populateConfigForm(configForm, state.config);
    isFormInitialized = true;
  }
});

// Expose on window for runtime diagnostics & console control
window.feederService = feederService;

// 2. Control Event Listeners
refillFoodManualBtn?.addEventListener("click", () => {
  refillFoodManualBtn.disabled = true;
  feederService.refillFoodManual(25);
  setTimeout(() => (refillFoodManualBtn.disabled = false), 1000);
});

refillWaterManualBtn?.addEventListener("click", () => {
  refillWaterManualBtn.disabled = true;
  feederService.refillWaterManual(50);
  setTimeout(() => (refillWaterManualBtn.disabled = false), 1000);
});

elements.autoFoodToggle?.addEventListener("change", (e) => {
  feederService.toggleAutoFood(e.target.checked);
});

elements.autoWaterToggle?.addEventListener("change", (e) => {
  feederService.toggleAutoWater(e.target.checked);
});

restockFoodBtn?.addEventListener("click", () => {
  feederService.restockBulkTank("food");
});

restockWaterBtn?.addEventListener("click", () => {
  feederService.restockBulkTank("water");
});

// 3. Test Spike Triggers
testHeatBtn?.addEventListener("click", () => {
  feederService.triggerRadicalSpike("temp_high");
});

testMoistBtn?.addEventListener("click", () => {
  feederService.triggerRadicalSpike("moisture_high");
});

testNormBtn?.addEventListener("click", () => {
  feederService.triggerRadicalSpike("normalize");
});

// 4. IoT Simulator Toggle
simToggle?.addEventListener("change", (e) => {
  feederService.toggleSimulation(e.target.checked);
});

// 5. Config Form Submission
configForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(configForm);
  const newConfig = {
    tempMin: parseFloat(formData.get("tempMin")),
    tempMax: parseFloat(formData.get("tempMax")),
    moistureMax: parseFloat(formData.get("moistureMax")),
    bowlWaterMin: parseInt(formData.get("bowlWaterMin"), 10),
    bowlWaterMax: parseInt(formData.get("bowlWaterMax"), 10),
    bowlFoodMin: parseInt(formData.get("bowlFoodMin"), 10),
    bowlFoodMax: parseInt(formData.get("bowlFoodMax"), 10),
  };

  const saveBtn = document.querySelector("#save-config-btn");
  if (saveBtn) {
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
  }

  await feederService.updateConfig(newConfig);

  if (saveBtn) {
    saveBtn.textContent = "Saved ✓";
    setTimeout(() => {
      saveBtn.textContent = "Save Setpoints";
      saveBtn.disabled = false;
    }, 1200);
  }
});

// 6. Theme Switching
function initTheme() {
  const saved = localStorage.getItem("aegis_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

themeBtn?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("aegis_theme", next);
});

initTheme();

// 7. Auth Lifecycle & Modal
function setModalMessage(msg = "") {
  if (modalAuthMsg) modalAuthMsg.textContent = msg;
}

authActionBtn?.addEventListener("click", async () => {
  if (auth.currentUser) {
    await logoutUser();
  } else {
    setModalMessage("");
    authModal?.classList.remove("hidden");
  }
});

modalCloseBtn?.addEventListener("click", () => {
  authModal?.classList.add("hidden");
});

modalAuthForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setModalMessage("");
  try {
    await loginWithEmail(modalEmail.value.trim(), modalPassword.value);
    authModal?.classList.add("hidden");
  } catch (err) {
    setModalMessage(err.message);
  }
});

modalSignupBtn?.addEventListener("click", async () => {
  setModalMessage("");
  try {
    await registerWithEmail(modalEmail.value.trim(), modalPassword.value);
    setModalMessage("Account registered successfully.");
    setTimeout(() => authModal?.classList.add("hidden"), 1000);
  } catch (err) {
    setModalMessage(err.message);
  }
});

modalAnonBtn?.addEventListener("click", async () => {
  setModalMessage("");
  try {
    await loginAnonymously();
    authModal?.classList.add("hidden");
  } catch (err) {
    setModalMessage(err.message);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const label = user.isAnonymous ? "Guest Station Link" : (user.email ?? user.uid.substring(0, 8));
    userDisplay.textContent = label;
    authActionBtn.textContent = "Sign Out";
    feederService.connectStation("station_01");
  } else {
    userDisplay.textContent = "Connecting to Firestore...";
    authActionBtn.textContent = "Sign In";
    try {
      await loginWithEmail("manager@aegispaws.com", "password123456");
    } catch (err) {
      console.warn("Auto-login fallback, using local station link:", err);
      feederService.connectStation("station_01");
    }
  }
});
