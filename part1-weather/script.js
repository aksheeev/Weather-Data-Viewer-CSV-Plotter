// ─── Config ────────────────────────────────────────────────────
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API   = "https://api.open-meteo.com/v1/forecast";

// Weather code → human readable description
const WMO_CODES = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail"
};

const WIND_DIRECTIONS = ["N","NE","E","SE","S","SW","W","NW"];

// ─── State ─────────────────────────────────────────────────────
let tempChart = null;
let rainChart = null;

// ─── DOM Refs ──────────────────────────────────────────────────
const cityInput     = document.getElementById("city-input");
const searchBtn     = document.getElementById("search-btn");
const suggestions   = document.getElementById("suggestions");
const dashboard     = document.getElementById("dashboard");
const emptyState    = document.getElementById("empty-state");
const loadingEl     = document.getElementById("loading");
const errorBanner   = document.getElementById("error-banner");
const errorMessage  = document.getElementById("error-message");

// ─── Utility Helpers ───────────────────────────────────────────
function windDegToDir(deg) {
  return WIND_DIRECTIONS[Math.round(deg / 45) % 8];
}

function formatHour(isoString) {
  const d = new Date(isoString);
  const h = d.getHours();
  return h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

function formatDay(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", { weekday: "short" });
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove("hidden");
  setTimeout(() => errorBanner.classList.add("hidden"), 4000);
}

function setLoading(on) {
  loadingEl.classList.toggle("hidden", !on);
}

function showDashboard() {
  emptyState.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

// ─── Geocoding (city search) ────────────────────────────────────
async function geocodeCity(query) {
  const url = `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res  = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// ─── Autocomplete ───────────────────────────────────────────────
let debounceTimer = null;

cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const q = cityInput.value.trim();
  if (q.length < 2) { suggestions.classList.add("hidden"); return; }

  debounceTimer = setTimeout(async () => {
    try {
      const results = await geocodeCity(q);
      renderSuggestions(results);
    } catch {
      suggestions.classList.add("hidden");
    }
  }, 300);
});

function renderSuggestions(results) {
  suggestions.innerHTML = "";
  if (!results.length) { suggestions.classList.add("hidden"); return; }

  results.forEach(r => {
    const li = document.createElement("li");
    const country = r.country_code ? ` (${r.country_code.toUpperCase()})` : "";
    const admin   = r.admin1 ? `, ${r.admin1}` : "";
    li.textContent = `${r.name}${admin}${country}`;
    li.addEventListener("click", () => {
      cityInput.value = r.name;
      suggestions.classList.add("hidden");
      fetchWeather(r.latitude, r.longitude, r.name, r.admin1, r.country);
    });
    suggestions.appendChild(li);
  });

  suggestions.classList.remove("hidden");
}

// Close suggestions on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    suggestions.classList.add("hidden");
  }
});

// ─── Search Button / Enter Key ──────────────────────────────────
searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

async function handleSearch() {
  const q = cityInput.value.trim();
  if (!q) return;
  suggestions.classList.add("hidden");

  try {
    setLoading(true);
    const results = await geocodeCity(q);
    if (!results.length) { showError("City not found. Please try a different name."); return; }
    const r = results[0];
    fetchWeather(r.latitude, r.longitude, r.name, r.admin1, r.country);
  } catch {
    showError("Network error. Please check your connection.");
  } finally {
    setLoading(false);
  }
}

// ─── Fetch Weather ──────────────────────────────────────────────
async function fetchWeather(lat, lon, cityName, admin1, country) {
  setLoading(true);
  dashboard.classList.add("hidden");

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    hourly:    [
      "temperature_2m", "precipitation_probability",
      "wind_speed_10m", "relative_humidity_2m", "weathercode"
    ].join(","),
    daily: [
      "temperature_2m_max", "temperature_2m_min",
      "precipitation_probability_max", "wind_speed_10m_max",
      "weathercode"
    ].join(","),
    current_weather:        true,
    wind_speed_unit:        "kmh",
    timezone:               "auto",
    forecast_days:          7
  });

  try {
    const res  = await fetch(`${WEATHER_API}?${params}`);
    const data = await res.json();
    renderDashboard(data, cityName, admin1, country);
  } catch {
    showError("Failed to fetch weather data. Please try again.");
  } finally {
    setLoading(false);
  }
}

// ─── Render Dashboard ───────────────────────────────────────────
function renderDashboard(data, cityName, admin1, country) {
  const cw      = data.current_weather;
  const hourly  = data.hourly;
  const daily   = data.daily;

  // Find index of current hour in hourly array
  const nowHour = new Date().toISOString().slice(0, 13);
  let currentIdx = hourly.time.findIndex(t => t.startsWith(nowHour));
  if (currentIdx === -1) currentIdx = 0;

  // ── City Header
  document.getElementById("city-name").textContent = cityName;
  const meta = [admin1, country].filter(Boolean).join(", ");
  document.getElementById("city-meta").textContent =
    `${meta} · Last updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  // ── Stat Cards
  document.getElementById("temperature").textContent =
    `${Math.round(cw.temperature)}°C`;

  document.getElementById("humidity").textContent =
    `${hourly.relative_humidity_2m[currentIdx]}%`;
  document.getElementById("wind-speed").textContent =
    `${Math.round(cw.windspeed)} km/h`;
  document.getElementById("wind-dir").textContent =
    `Direction: ${windDegToDir(cw.winddirection)}`;

  // UV index isn't in free tier — show weather description instead
  const wCode = cw.weathercode;
  document.getElementById("uv-index").textContent =
    WMO_CODES[wCode] ?? "Clear";
  document.getElementById("weather-desc").textContent =
    `Weather code ${wCode}`;

  // ── Charts
  const next24Hours   = hourly.time.slice(currentIdx, currentIdx + 24);
  const next24Temps   = hourly.temperature_2m.slice(currentIdx, currentIdx + 24);
  const next24Rain    = hourly.precipitation_probability.slice(currentIdx, currentIdx + 24);
  const labels        = next24Hours.map(formatHour);

  renderTempChart(labels, next24Temps);
  renderRainChart(labels, next24Rain);

  // ── Hourly Strip
  renderHourlyStrip(hourly, currentIdx);

  // ── Daily Forecast
  renderDailyForecast(daily);

  showDashboard();
}

// ─── Temperature Chart ──────────────────────────────────────────
function renderTempChart(labels, temps) {
  if (tempChart) tempChart.destroy();

  const ctx = document.getElementById("temp-chart").getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0,   "rgba(249, 115, 22, 0.35)");
  gradient.addColorStop(1,   "rgba(249, 115, 22, 0.0)");

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temps,
        borderColor: "#f97316",
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#f97316",
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e2130",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          titleColor: "#94a3b8",
          bodyColor: "#f1f5f9",
          padding: 10,
          callbacks: {
            label: ctx => ` ${Math.round(ctx.parsed.y)}°C`
          }
        }
      },
      scales: {
        x: {
          grid:  { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#475569", font: { size: 11 }, maxTicksLimit: 8 }
        },
        y: {
          grid:  { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#475569",
            font: { size: 11 },
            callback: v => `${v}°`
          }
        }
      }
    }
  });
}

// ─── Rain Chart ─────────────────────────────────────────────────
function renderRainChart(labels, rainData) {
  if (rainChart) rainChart.destroy();

  const ctx = document.getElementById("rain-chart").getContext("2d");

  rainChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Precipitation Probability (%)",
        data: rainData,
        backgroundColor: "rgba(34, 211, 238, 0.25)",
        borderColor:     "rgba(34, 211, 238, 0.8)",
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e2130",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          titleColor: "#94a3b8",
          bodyColor: "#f1f5f9",
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid:  { display: false },
          ticks: { color: "#475569", font: { size: 11 }, maxTicksLimit: 8 }
        },
        y: {
          min: 0,
          max: 100,
          grid:  { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#475569",
            font: { size: 11 },
            callback: v => `${v}%`
          }
        }
      }
    }
  });
}

// ─── Hourly Strip ───────────────────────────────────────────────
function renderHourlyStrip(hourly, currentIdx) {
  const strip = document.getElementById("hourly-strip");
  strip.innerHTML = "";

  // Show 24 hours from now
  const slice = hourly.time.slice(currentIdx, currentIdx + 24);

  slice.forEach((time, i) => {
    const card = document.createElement("div");
    card.className = "hourly-card" + (i === 0 ? " current" : "");

    const temp = Math.round(hourly.temperature_2m[currentIdx + i]);
    const rain = hourly.precipitation_probability[currentIdx + i];

    card.innerHTML = `
      <span class="hourly-time">${i === 0 ? "Now" : formatHour(time)}</span>
      <span class="hourly-temp">${temp}°</span>
      <span class="hourly-rain">${rain}%</span>
    `;
    strip.appendChild(card);
  });
}

// ─── Daily Forecast ─────────────────────────────────────────────
function renderDailyForecast(daily) {
  const grid = document.getElementById("daily-grid");
  grid.innerHTML = "";

  daily.time.forEach((date, i) => {
    const card = document.createElement("div");
    card.className = "daily-card";

    const max  = Math.round(daily.temperature_2m_max[i]);
    const min  = Math.round(daily.temperature_2m_min[i]);
    const rain = daily.precipitation_probability_max[i];
    const wind = Math.round(daily.wind_speed_10m_max[i]);
    const desc = WMO_CODES[daily.weathercode[i]] ?? "Clear";
    const day  = i === 0 ? "Today" : formatDay(date);

    card.innerHTML = `
      <span class="daily-day">${day}</span>
      <span class="daily-temps">${max}° <span>${min}°</span></span>
      <span class="daily-rain">&#9681; ${rain}% rain</span>
      <span class="daily-wind">&#10148; ${wind} km/h</span>
      <span class="stat-sub" style="font-size:11px">${desc}</span>
    `;
    grid.appendChild(card);
  });
}

// ─── Load default city on startup ──────────────────────────────
fetchWeather(18.5204, 73.8567, "Pune", "Maharashtra", "India");