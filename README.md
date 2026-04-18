# Aeron Systems – AI Prototyping Intern Assignment

**Built by:** Aksheev Tanwar  
**Submitted:** April 2026  
**AI Tool Used:** Claude (claude.ai) — Sonnet model, ChatGPT, Figma.ai (dashboard visualization)  
**Repository:** https://github.com/aksheeev/Aeron-Intern-Assignment

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Part 1 – Weather Data Viewer](#part-1--weather-data-viewer)
   - [What It Does](#what-it-does)
   - [Tech Stack](#tech-stack)
   - [File Structure](#file-structure)
   - [How to Run](#how-to-run)
   - [Architecture Overview](#architecture-overview)
   - [Sequential Pipeline](#sequential-pipeline)
3. [Part 2 – Python CSV Plotter](#part-2--python-csv-plotter)
   - [What It Does](#what-it-does-1)
   - [Tech Stack](#tech-stack-1)
   - [File Structure](#file-structure-1)
   - [How to Run](#how-to-run-1)
   - [Architecture Overview](#architecture-overview-1)
   - [Sequential Pipeline](#sequential-pipeline-1)
4. [AI Workflow & Prompts](#ai-workflow--prompts)
5. [Manual Changes](#manual-changes)
6. [Issues Encountered & Solutions](#issues-encountered--solutions)
7. [Dependencies Summary](#dependencies-summary)

---

## Project Overview

This submission contains two working utilities built using Claude (claude.ai) as the primary AI assistant:

- **Part 1:** A browser-based **Weather Data Viewer** — fetches live weather for any city and displays it on an interactive dark-themed dashboard with charts and a map.
- **Part 2:** A desktop **Python CSV Plotter** — a Tkinter GUI app that loads any CSV file and plots user-selected columns as a line chart, bar chart, or scatter plot.

Both utilities are designed to run cross-platform (Windows x86 and Debian ARM) with minimal setup.

---

## Part 1 – Weather Data Viewer

### What It Does

- Search any city in the world using a live autocomplete search bar
- Displays current **temperature**, **humidity**, **wind speed**, and **weather condition**
- Plots three hourly charts for the next 24 hours:
  - **Temperature (°C) + Humidity (%)** — dual-axis line chart, orange and cyan
  - **Precipitation Probability (%)** — bar chart
  - **Wind Speed (km/h)** — line chart
- Shows a scrollable **Hourly Forecast strip** and a **7-Day Forecast grid**
- Renders an interactive **Leaflet.js city map** with a colour-coded temperature marker (red → orange → yellow → light blue → dark blue, from hot to cold) and a popup showing all key stats

### Tech Stack

| Component | Choice | Reason |
|---|---|---|
| Frontend | HTML + CSS + Vanilla JS (3 files) | Zero build step, runs on any browser |
| Weather API | [Open-Meteo](https://open-meteo.com/) | Completely free, no API key required |
| Geocoding | Open-Meteo Geocoding API | Autocomplete city search with lat/lon |
| Charts | [Chart.js](https://www.chartjs.org/) via CDN | Easy to configure, smooth animations |
| Map | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap | Free, no API key, works offline with cached tiles |

### File Structure

```
part1-weather/
├── index.html    ← HTML structure, loads CDN libraries
├── style.css     ← All styling (dark theme, CSS variables, responsive)
└── script.js     ← All API calls, chart rendering, map, event handlers
```

### How to Run

**No installation required.** Just serve the files with any static server:

```bash
# Option 1: Python (recommended)
cd part1-weather
python3 -m http.server 5500
# Open http://127.0.0.1:5500 in your browser

# Option 2: VS Code Live Server extension (right-click index.html → Open with Live Server)

# Option 3: Node.js
npx serve part1-weather
```

> ⚠️ **Do not open `index.html` directly as a `file://` URL** — Leaflet.js tiles will not load due to CORS restrictions. Always use a local server.

**Requirements:**
- Any modern browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for API calls and map tiles)
- No installs needed

---

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER LAYER                                │
│                                                                     │
│  index.html                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  CDN Scripts │  │   style.css  │  │   DOM Elements           │  │
│  │  Chart.js    │  │  Dark theme  │  │  Header + Search Bar     │  │
│  │  Leaflet.js  │  │  CSS vars    │  │  Stat Cards (4)          │  │
│  └──────────────┘  └──────────────┘  │  Chart Canvases (3)      │  │
│                                       │  Hourly Strip            │  │
│                                       │  7-Day Grid              │  │
│                                       │  Leaflet Map Div         │  │
│                                       └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIC LAYER  (script.js)                    │
│                                                                     │
│  Config / Constants                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  GEOCODING_API   WEATHER_API   WMO_CODES   WIND_DIRECTIONS  │   │
│  │  tempToColor()                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  User Input                                                         │
│  ┌──────────────┐     ┌──────────────────────────────────────────┐  │
│  │  cityInput   │────▶│  handleSearch()  /  suggestion click    │  │
│  │  searchBtn   │     └──────────────────────────────────────────┘  │
│  └──────────────┘                        │                          │
│                                          ▼                          │
│  API Calls                                                          │
│  ┌──────────────────┐      ┌──────────────────────────────────────┐ │
│  │  geocodeCity()   │      │         fetchWeather()               │ │
│  │  (debounced      │      │  Builds URLSearchParams, fetches     │ │
│  │   autocomplete)  │      │  hourly + daily + current weather    │ │
│  └──────────────────┘      └──────────────────────────────────────┘ │
│                                          │                          │
│                                          ▼                          │
│  Orchestrator                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   renderDashboard()                          │   │
│  │  Finds currentIdx → slices hourly array → fans out to:      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│       │           │           │           │           │             │
│       ▼           ▼           ▼           ▼           ▼             │
│  renderTemp  renderRain  renderWind  renderHourly  renderDaily      │
│  Chart()     Chart()     Chart()     Strip()       Forecast()       │
│       │                                                │            │
│       └────────────────────────────────────────────────┘            │
│                             │                                       │
│                             ▼                                       │
│                        renderMap()                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  tempToColor(temp) → marker colour                          │   │
│  │  L.divIcon() custom HTML marker                             │   │
│  │  bindPopup() with stats table                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Utility Helpers (stateless)                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  windDegToDir()   formatHour()   formatDay()                 │  │
│  │  showError()      setLoading()   showDashboard()             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER  (External)                       │
│                                                                     │
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Open-Meteo         │  │  Open-Meteo Geocoding API            │  │
│  │  Geocoding API      │  │  https://geocoding-api.open-meteo... │  │
│  │  (city search)      │  │  Returns: lat, lon, name, country    │  │
│  └─────────────────────┘  └──────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Open-Meteo Weather API                                     │    │
│  │  https://api.open-meteo.com/v1/forecast                     │    │
│  │  Returns: current_weather, hourly[], daily[]                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  OpenStreetMap Tile Server (via Leaflet.js)                 │    │
│  │  https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png         │    │
│  │  Returns: map tiles                                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Sequential Pipeline

```
  USER
   │
   │  Types city name in search bar
   ▼
┌──────────────────────────────────────────┐
│  STEP 1 – Debounced Input Listener       │
│  300ms timer resets on each keystroke    │
│  Fires geocodeCity() when user pauses    │
└──────────────────────────────────────────┘
   │
   │  GET /geocoding-api.open-meteo.com?name=...
   ▼
┌──────────────────────────────────────────┐
│  STEP 2 – Geocoding API Call             │
│  Returns up to 5 city matches with       │
│  name, country, lat, lon                 │
└──────────────────────────────────────────┘
   │
   │  Results rendered as dropdown list
   ▼
┌──────────────────────────────────────────┐
│  STEP 3 – User Selects City              │
│  (click suggestion OR press Enter/Search │
│   button → takes results[0])             │
└──────────────────────────────────────────┘
   │
   │  lat, lon, cityName known
   ▼
┌──────────────────────────────────────────┐
│  STEP 4 – fetchWeather(lat, lon, ...)    │
│  Builds URLSearchParams with:            │
│  hourly, daily, current_weather fields   │
│  Shows loading spinner                   │
└──────────────────────────────────────────┘
   │
   │  GET /api.open-meteo.com/v1/forecast?...
   ▼
┌──────────────────────────────────────────┐
│  STEP 5 – Weather API Response           │
│  JSON: current_weather, hourly[], daily[]│
│  currentIdx = index of current hour      │
└──────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 6 – renderDashboard() [ORCHESTRATOR│
│  Slices next 24h from hourly array       │
│  Updates stat cards (temp, humidity,     │
│  wind, weather description)              │
└──────────────────────────────────────────┘
   │
   ├──────────────────────────────────────┐
   │                                      │
   ▼                                      ▼
┌──────────────────────────┐  ┌──────────────────────────────────────┐
│  STEP 7a – Charts (x3)   │  │  STEP 7b – Forecast Sections         │
│  renderTempChart()        │  │  renderHourlyStrip() → 24 cards      │
│  → dual-axis (temp+humid) │  │  renderDailyForecast() → 7 cards     │
│  renderRainChart()        │  └──────────────────────────────────────┘
│  → bar chart              │
│  renderWindChart()        │
│  → line chart             │
│  (old chart destroyed     │
│   before re-draw)         │
└──────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 8 – renderMap()                    │
│  tempToColor(temp) → marker colour       │
│  Leaflet marker placed at lat/lon        │
│  Popup with temp, humidity, wind,        │
│  condition bound and opened              │
│  map.invalidateSize() called after 100ms │
│  to fix tile rendering on initial load   │
└──────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 9 – Dashboard Shown                │
│  showDashboard() removes 'hidden' class  │
│  User can search again → loops to STEP 1 │
└──────────────────────────────────────────┘
```

---

## Part 2 – Python CSV Plotter

### What It Does

- A desktop GUI application built with Tkinter
- User browses and loads any `.csv` file via a file picker dialog
- Column headers are auto-populated into X Axis and Y Axis dropdowns
- User selects chart type: **Line Chart**, **Bar Chart**, or **Scatter Plot**
- Clicking **Plot Graph** renders the chart inside the app window (not a separate popup)
- A **Clear** button resets the plot area
- Displays row and column count of the loaded CSV
- Dark theme that matches Part 1's aesthetic
- Includes a `sample_data.csv` with Pune monthly climate data for demo

### Tech Stack

| Component | Choice | Reason |
|---|---|---|
| Language | Python 3 | Cross-platform, widely available |
| GUI | `tkinter` (built-in) | No install needed, works on Windows + Linux |
| Data Loading | `pandas` | Industry standard CSV parsing |
| Plotting | `matplotlib` | Industry standard, embeds via `FigureCanvasTkAgg` |
| Chart Embedding | `matplotlib.backends.backend_tkagg.FigureCanvasTkAgg` | Renders plots inside Tkinter window |

### File Structure

```
part2-csv-plotter/
├── plotter.py         ← Main application (single class: CSVPlotter)
├── sample_data.csv    ← Demo dataset (Pune monthly climate)
└── requirements.txt   ← pandas, matplotlib
```

### How to Run

```bash
# Step 1: Install dependencies
cd part2-csv-plotter
pip install -r requirements.txt

# Step 2: Run the app
python3 plotter.py
# or on Windows:
python plotter.py
```

**Requirements:**
- Python 3.8+
- pip packages: `pandas>=2.0.0`, `matplotlib>=3.7.0`
- `tkinter` — built into Python (no pip install needed)
- Works on Windows x86 and Debian ARM

> On Debian/Ubuntu, if tkinter is missing: `sudo apt install python3-tk`

---

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TKINTER UI LAYER                               │
│                                                                     │
│  CSVPlotter Window (1000×700)                                       │
│  ┌───────────────────────┐   ┌─────────────────────────────────┐   │
│  │   LEFT PANEL (260px)  │   │   RIGHT PANEL (expands)         │   │
│  │                       │   │                                 │   │
│  │  Logo + subtitle      │   │  Placeholder (on startup)       │   │
│  │  ─────────────────    │   │  "Load a CSV and click Plot"    │   │
│  │  [Browse CSV] button  │   │                                 │   │
│  │  File name label      │   │  FigureCanvasTkAgg              │   │
│  │  ─────────────────    │   │  (matplotlib figure embedded    │   │
│  │  X Axis dropdown      │   │   in Tkinter — NOT a popup)     │   │
│  │  Y Axis dropdown      │   │                                 │   │
│  │  ─────────────────    │   └─────────────────────────────────┘   │
│  │  ○ Line Chart         │                                         │
│  │  ○ Bar Chart          │                                         │
│  │  ○ Scatter Plot       │                                         │
│  │  ─────────────────    │                                         │
│  │  [Plot Graph] button  │                                         │
│  │  [Clear]    button    │                                         │
│  │  12 rows · 6 columns  │                                         │
│  └───────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CLASS METHODS LAYER                              │
│                                                                     │
│  class CSVPlotter(tk.Tk)                                            │
│                                                                     │
│  __init__()          ← Sets up window, state variables              │
│  _build_ui()         ← Constructs all widgets                       │
│  _apply_styles()     ← Configures ttk.Style (dark Combobox theme)  │
│                                                                     │
│  _load_csv()         ← Opens file dialog, reads with pandas,        │
│                         populates dropdowns with column names       │
│                                                                     │
│  _plot()             ← Validates inputs (3 guards), calls          │
│                         _draw_plot() on success                     │
│                                                                     │
│  _draw_plot()        ← Destroys old canvas, applies dark rcParams,  │
│                         draws correct chart type, embeds in window  │
│                                                                     │
│  _clear_plot()       ← Destroys canvas, closes figure, shows       │
│                         placeholder again                           │
│                                                                     │
│  UI helpers:                                                        │
│  _divider()  _section_label()  _field_label()                       │
│                                                                     │
│  Instance State:                                                     │
│  self.df             ← pandas DataFrame (stays loaded between plots)│
│  self.fig            ← current matplotlib Figure                    │
│  self.canvas_widget  ← current FigureCanvasTkAgg                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      LIBRARIES LAYER                                │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ tkinter  │  │  pandas  │  │ matplotlib │  │ FigureCanvasTkAgg│  │
│  │ built-in │  │ read_csv │  │  pyplot    │  │ (backend bridge) │  │
│  │ GUI kit  │  │ to_numeric│  │ rcParams  │  │ embeds plt inside│  │
│  └──────────┘  └──────────┘  └────────────┘  │ Tkinter window   │  │
│                                               └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Sequential Pipeline

```
  USER
   │
   │  Launches: python plotter.py
   ▼
┌──────────────────────────────────────────┐
│  STEP 1 – App Startup                    │
│  CSVPlotter.__init__() creates window    │
│  _build_ui() renders all widgets         │
│  Placeholder shown, dropdowns disabled   │
└──────────────────────────────────────────┘
   │
   │  User clicks [Browse CSV]
   ▼
┌──────────────────────────────────────────┐
│  STEP 2 – File Dialog                    │
│  filedialog.askopenfilename() opens      │
│  OS native file picker (*.csv filter)    │
└──────────────────────────────────────────┘
   │
   │  User selects a .csv file
   ▼
┌──────────────────────────────────────────┐
│  STEP 3 – CSV Load                       │
│  pd.read_csv(path) → self.df             │
│  Column names → X and Y dropdowns        │
│  Smart default: col[0] → X, col[1] → Y  │
│  Row/column count shown at bottom        │
└──────────────────────────────────────────┘
   │
   │  User selects X axis, Y axis, chart type
   │  Clicks [Plot Graph]
   ▼
┌──────────────────────────────────────────┐
│  STEP 4 – _plot() called                 │
└──────────────────────────────────────────┘
   │
   ├── GUARD 1: No CSV loaded? → warning dialog, stop
   ├── GUARD 2: X or Y column empty? → warning dialog, stop
   └── GUARD 3: Y column all non-numeric?
                pd.to_numeric(errors="coerce") converts to NaN
                If all NaN → error dialog, stop
   │
   │  All guards pass
   ▼
┌──────────────────────────────────────────┐
│  STEP 5 – Destroy Previous Plot          │
│  canvas_widget.get_tk_widget().destroy() │
│  plt.close(self.fig)                     │
│  (prevents memory leak from stacking)    │
└──────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 6 – Apply Dark Theme               │
│  plt.rcParams.update({...})              │
│  Sets figure/axes colours to match       │
│  the dark Tkinter panel                  │
└──────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 7 – Draw Chart (branch by type)    │
│                                          │
│  "Line Chart"    → ax.plot() + fill      │
│  "Bar Chart"     → ax.bar() with         │
│                    range(len(x)) positions│
│                    + manual x tick labels │
│  "Scatter Plot"  → ax.scatter()          │
│                                          │
│  All types share same axis formatting:   │
│  title, xlabel, ylabel, grid, spines     │
└──────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 8 – Embed in Tkinter Window        │
│  FigureCanvasTkAgg(fig, master=frame)    │
│  canvas.draw()                           │
│  canvas.get_tk_widget().pack()           │
│  Placeholder hidden                      │
└──────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  STEP 9 – Ready for Next Plot            │
│  self.df still loaded in memory          │
│  User can change columns/type and re-plot│
│  Or click [Clear] to reset               │
│  Or [Browse CSV] to load a new file      │
└──────────────────────────────────────────┘
```

---

## AI Workflow & Prompts

All AI interactions were conducted in a single Claude (claude.ai) conversation. The full chat history is included as `ai-prompts/prompts.pdf`.

### Summary of Key Prompts Used

**Initial Planning:**
> "I need to complete this assignment within 30 hours, I choose weather viewer for part 1 and csv plotter for part 2, provide me a plan on how to complete it (all the tech stack I can use, it should be doable and visually impressive)"

**File Structure Correction:**
> "minor changes single html file is risky as it is stated in the document to have proper file system: like this index.html style.css script.js"

**Code Generation (Part 1):**
> "give code for index.html, style.css and script.js one by one" (Claude generated each file separately in sequence)

**Feature Additions:**
> "okay few things I'd like to add: 1) A wind speed chart 2) Combine humidity in the temperature chart, both of different color 3) A city map using leaflet.js and a marker highlighting it with colors according to the temperature (red, orange, yellow, light blue, dark blue; from hot to cold), it will serve as a summary with all important fields like wind speed, humidity, temp around it."

**Code Generation (Part 2):**
> "lets go with part 2" → Claude asked 3 clarifying questions (dropdowns for columns, extra graph types, GUI style) and then generated all 3 files.

**Architecture Diagrams:**
> "Give the program architecture for part 1, for understanding"  
> "and a sequential pipeline diagram for part 1, to show how things work and in what order"  
> "Now architecture diagram for part 2"  
> "sequential pipeline diagram for part 2"  
> "make it more readable less clustered, text should not go beyond the box and not overlap"

---

## Manual Changes

These are changes made directly to the AI-generated code after reviewing it:

### Part 1 – Weather Data Viewer

**1. Removed inaccurate "Feels Like" display**

The AI used `cw.temperature - 2` as a shortcut for feels-like temperature. This is not scientifically accurate (feels-like depends on wind and humidity). The `feels-like` element and its corresponding JS line were removed entirely.

```html
<!-- REMOVED from index.html (line 71): -->
<span class="stat-sub" id="feels-like">Feels like --</span>
```
```javascript
// REMOVED from script.js (lines 193-194):
document.getElementById("feels-like").textContent =
  `Feels like ${Math.round(cw.temperature - 2)}°C`;
```

**2. Changed "UV Index" card to "Weather Condition"**

The free tier of the Open-Meteo API does not include UV Index data. The card was repurposed to show the human-readable weather description derived from the WMO weather code.

```html
<!-- CHANGED in index.html: -->
<span class="stat-label">UV Index</span>
<!-- TO: -->
<span class="stat-label">Weather Condition</span>
```

The JS already used `WMO_CODES[wCode]` for this card's value — only the label in the HTML was updated to match.

**3. Fixed Leaflet.js map tile rendering on initial load**

Leaflet tiles only rendered correctly after resizing the browser or opening DevTools. This is a known Leaflet issue when the map container is hidden/zero-size at the time of initialisation.

Added `map.invalidateSize()` inside a 100ms `setTimeout` at the end of `renderMap()`, which forces Leaflet to recalculate tile positions after the DOM has fully painted:

```javascript
// Added at end of renderMap():
setTimeout(() => {
  if (map) {
    map.invalidateSize();
  }
}, 100);
```

*Source: Leaflet GitHub Discussions #8795 — "Map not rendering correctly on load, but fine on viewport resize"*

### Part 2 – Python CSV Plotter

No manual changes were required. The AI-generated code ran correctly on first attempt.

---

## Issues Encountered & Solutions

### Issue 1: Leaflet Map Tiles Not Rendering on Page Load

**Symptom:** The city map showed only a small portion of tiles in the top-left corner. Switching to DevTools or resizing the browser fixed it instantly.

**Root Cause:** Leaflet initialises the map tile grid based on the container's pixel dimensions at the moment `L.map()` is called. Since the dashboard div was hidden (`display: none`) when the page loaded, and only shown after the first API call, Leaflet calculated dimensions as 0×0.

**Solution:** Call `map.invalidateSize()` in a `setTimeout` after rendering to force Leaflet to recalculate the tile grid:
```javascript
setTimeout(() => { if (map) map.invalidateSize(); }, 100);
```

---

## Dependencies Summary

### Part 1 – Weather Data Viewer

All dependencies are loaded via CDN. No installation needed.

| Library | Version | CDN |
|---|---|---|
| Chart.js | latest | `https://cdn.jsdelivr.net/npm/chart.js` |
| Leaflet.js | 1.9.4 | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |
| Leaflet CSS | 1.9.4 | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| Open-Meteo API | — | Free, no key required |
| OpenStreetMap | — | Free, no key required |

### Part 2 – Python CSV Plotter

```
pandas>=2.0.0
matplotlib>=3.7.0
```

`tkinter` is bundled with Python. On Debian/Ubuntu if missing:
```bash
sudo apt install python3-tk
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

---

## Quick Start Summary

| | Part 1 | Part 2 |
|---|---|---|
| **Language** | HTML / CSS / JS | Python 3 |
| **Run command** | `python3 -m http.server 5500` then open browser | `python3 plotter.py` |
| **Install needed?** | No (CDN only) | Yes: `pip install -r requirements.txt` |
| **Internet required?** | Yes (API + map tiles) | No (local file processing) |
| **Platform** | Any browser | Windows x86 / Debian ARM |
