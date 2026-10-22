// UI Renderer: Live Gauges, Status Cards, Alert Banners, Controls, and Telemetry Feed
// Now works with ECS 5-tier tier-separated data

export function renderAlerts(container, alerts) {
  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="alert-banner alert-nominal">
        <div class="alert-icon">✨</div>
        <div class="alert-content">
          <strong>All Systems Nominal</strong>
          <span>Environment and bowl levels are within safe, configured parameters.</span>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="alert-banner alert-${alert.type}">
      <div class="alert-icon">
        ${alert.type === 'critical' ? '🚨' : alert.type === 'action_required' ? '⚠️' : '🔔'}
      </div>
      <div class="alert-content">
        <div class="alert-header">
          <strong>${alert.title}</strong>
          <span class="alert-time">${alert.timestamp}</span>
          <span class="alert-tier">${alert.tier}</span>
        </div>
        <p>${alert.message}</p>
      </div>
    </div>
  `).join('');
}

export function renderTelemetry(state, elements) {
  const {
    foodTank, waterTank, bowlFood, bowlWater, foodTankTemp, foodTankMoisture,
    autoFillFood, autoFillWater, status, config, capacities, lastUpdated
  } = state;

  // Food Tank
  const foodTankPct = Math.min(100, Math.round((foodTank / capacities.foodTank) * 100));
  if (elements.foodTankVal) elements.foodTankVal.innerHTML = `${Math.round(foodTank)}<span class="unit">g</span>`;
  if (elements.foodTankSub) elements.foodTankSub.textContent = `${foodTankPct}% of ${capacities.foodTank}g capacity`;
  if (elements.foodTankBar) elements.foodTankBar.style.width = `${foodTankPct}%`;

  // Water Tank
  const waterTankPct = Math.min(100, Math.round((waterTank / capacities.waterTank) * 100));
  if (elements.waterTankVal) elements.waterTankVal.innerHTML = `${Math.round(waterTank)}<span class="unit">ml</span>`;
  if (elements.waterTankSub) elements.waterTankSub.textContent = `${waterTankPct}% of ${capacities.waterTank}ml capacity`;
  if (elements.waterTankBar) elements.waterTankBar.style.width = `${waterTankPct}%`;

  // Food Bowl
  const bowlFoodPct = Math.min(100, Math.round((bowlFood / capacities.bowlFoodMaxLimit) * 100));
  if (elements.bowlFoodVal) elements.bowlFoodVal.innerHTML = `${Math.round(bowlFood)}<span class="unit">g</span>`;
  if (elements.bowlFoodSub) elements.bowlFoodSub.textContent = `Target: ${config.bowlFoodMin}g – ${config.bowlFoodMax}g`;
  if (elements.bowlFoodBar) elements.bowlFoodBar.style.width = `${bowlFoodPct}%`;
  if (elements.bowlFoodStatus) {
    if (bowlFood <= config.bowlFoodMin) {
      elements.bowlFoodStatus.className = "metric-pill pill-warn";
      elements.bowlFoodStatus.textContent = autoFillFood ? "Auto-Filling..." : "Low (Manual Refill Needed)";
    } else {
      elements.bowlFoodStatus.className = "metric-pill pill-ok";
      elements.bowlFoodStatus.textContent = "Optimal";
    }
  }

  // Water Bowl
  const bowlWaterPct = Math.min(100, Math.round((bowlWater / capacities.bowlWaterMaxLimit) * 100));
  if (elements.bowlWaterVal) elements.bowlWaterVal.innerHTML = `${Math.round(bowlWater)}<span class="unit">ml</span>`;
  if (elements.bowlWaterSub) elements.bowlWaterSub.textContent = `Target: ${config.bowlWaterMin}ml – ${config.bowlWaterMax}ml`;
  if (elements.bowlWaterBar) elements.bowlWaterBar.style.width = `${bowlWaterPct}%`;
  if (elements.bowlWaterStatus) {
    if (bowlWater <= config.bowlWaterMin) {
      elements.bowlWaterStatus.className = "metric-pill pill-warn";
      elements.bowlWaterStatus.textContent = autoFillWater ? "Auto-Filling..." : "Low (Manual Refill Needed)";
    } else {
      elements.bowlWaterStatus.className = "metric-pill pill-ok";
      elements.bowlWaterStatus.textContent = "Optimal";
    }
  }

  // Climate (Temp & Moisture)
  if (elements.tempVal) elements.tempVal.innerHTML = `${foodTankTemp.toFixed(1)}<span class="unit">°C</span>`;
  if (elements.moistureVal) elements.moistureVal.innerHTML = `${foodTankMoisture.toFixed(1)}<span class="unit">%</span>`;
  if (elements.climateRange) {
    elements.climateRange.textContent = `Safe: ${config.tempMin}°C–${config.tempMax}°C | Max ${config.moistureMax}% RH`;
  }

  // Temperature Status Pill
  if (elements.tempStatus) {
    if (foodTankTemp > config.tempMax) {
      elements.tempStatus.className = "metric-pill pill-critical";
      elements.tempStatus.textContent = "Radical High!";
    } else if (foodTankTemp < config.tempMin) {
      elements.tempStatus.className = "metric-pill pill-warn";
      elements.tempStatus.textContent = "Radical Low";
    } else {
      elements.tempStatus.className = "metric-pill pill-ok";
      elements.tempStatus.textContent = "Nominal";
    }
  }

  // Moisture Status Pill
  if (elements.moistureStatus) {
    if (foodTankMoisture > config.moistureMax) {
      elements.moistureStatus.className = "metric-pill pill-critical";
      elements.moistureStatus.textContent = "Radical Moisture!";
    } else {
      elements.moistureStatus.className = "metric-pill pill-ok";
      elements.moistureStatus.textContent = "Dry & Safe";
    }
  }

  // Auto Toggles State
  if (elements.autoFoodToggle) {
    elements.autoFoodToggle.checked = Boolean(autoFillFood);
  }
  if (elements.autoWaterToggle) {
    elements.autoWaterToggle.checked = Boolean(autoFillWater);
  }

  // Status Indicator
  if (elements.statusBadge) {
    if (status === "dispensing_food") {
      elements.statusBadge.className = "status-badge status-dispensing";
      elements.statusBadge.textContent = "Dispensing Food...";
    } else if (status === "dispensing_water") {
      elements.statusBadge.className = "status-badge status-dispensing";
      elements.statusBadge.textContent = "Dispensing Water...";
    } else {
      elements.statusBadge.className = "status-badge status-online";
      elements.statusBadge.textContent = "Online • Telemetry Live";
    }
  }

  if (elements.lastUpdatedVal) {
    elements.lastUpdatedVal.textContent = new Date(lastUpdated).toLocaleTimeString();
  }
}

export function populateConfigForm(form, config) {
  if (!form || !config) return;
  form.tempMin.value = config.tempMin ?? 16;
  form.tempMax.value = config.tempMax ?? 28;
  form.moistureMax.value = config.moistureMax ?? 65;
  form.bowlWaterMin.value = config.bowlWaterMin ?? 50;
  form.bowlWaterMax.value = config.bowlWaterMax ?? 200;
  form.bowlFoodMin.value = config.bowlFoodMin ?? 30;
  form.bowlFoodMax.value = config.bowlFoodMax ?? 100;
}

export function renderLogs(container, logs) {
  if (!container) return;
  if (!logs || logs.length === 0) {
    container.innerHTML = `<li class="log-item muted">No activity recorded yet.</li>`;
    return;
  }
  container.innerHTML = logs.map(item => `
    <li class="log-item log-${item.type}">
      <span class="log-time">${item.time}</span>
      <span class="log-msg">${item.message}</span>
    </li>
  `).join('');
}
