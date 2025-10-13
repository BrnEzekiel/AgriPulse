// --- STATE MANAGEMENT ---
let isLoggedIn = false;
let userName = "John Farmer";
let userEmail = "john@agrifarm.com";
let currentTheme = "theme-green";
let suggestedVendorId = null; 

// Chart and Map Instances
let cashFlowChartInstance, precipitationForecastChartInstance, priceDiscoveryChartInstance;
let yieldForecastChartInstance, moistureRainfallChartInstance, scenarioChartInstance;
let mapInstance;
let fieldBoundaryLayer;

const defaultFields = [
    { 
        id: 'maize-field-1', name: 'Maize Field 1', type: 'Crop', subtype: 'Maize', status: 'Growing',
        lat: -1.286389, lon: 36.817223, // Nairobi coordinates for simulation
        boundary: [ // Simulated Field Boundary (A square shape)
            [-1.28, 36.81],
            [-1.29, 36.81],
            [-1.29, 36.82],
            [-1.28, 36.82]
        ]
    },
    { 
        id: 'poultry-coop-1', name: 'Poultry Coop 1', type: 'Livestock', subtype: 'Broilers', status: 'Active',
        lat: -0.416667, lon: 36.933333, // Nyeri coordinates for simulation
        boundary: [
             [-0.41, 36.93],
             [-0.41, 36.94],
             [-0.42, 36.94]
        ]
    },
];
let userFields = defaultFields;
let currentFieldId = defaultFields[0].id; 

let marketplaceListings = [
    {
        id: 'list-1', title: 'Azoxystrobin Fungicide 1L', category: 'pesticide', price: 5500, 
        description: 'Broad-spectrum fungicide effective against Maize Leaf Blight. High concentration.',
        seller: 'AgroChemicals Ltd.', email: 'sales@agrochemicals.com', whatsapp: '254700100200', phone: '020222333', img: 'https://images.unsplash.com/photo-1594318029517-f584e27f4d43?w=400'
    },
    {
        id: 'list-2', title: 'Urea Fertilizer (50kg Bag)', category: 'fertilizer', price: 7800, 
        description: 'High quality 46-0-0 Urea for top dressing.',
        seller: 'Farm Input Depot', email: 'info@farmdepot.co.ke', whatsapp: '254711222333', phone: '020444555', phone: '020444555', img: 'https://images.unsplash.com/photo-1549487950-8a719c2f689e?w=400'
    },
];

let farmTasks = [
    { id: 1, fieldId: 'maize-field-1', title: 'Irrigation Check', date: '2025-10-15', priority: 'high', completed: false, recommended: true },
    { id: 2, fieldId: 'poultry-coop-1', title: 'Vaccinate Broilers', date: '2025-10-18', priority: 'high', completed: false, recommended: false },
    { id: 3, fieldId: 'maize-field-1', title: 'Apply Top Dressing Fertilizer', date: '2025-10-22', priority: 'medium', completed: true, recommended: false },
];

let farmInventory = [
    { id: 1, name: 'Urea (50kg)', category: 'Fertilizer', quantity: 50, unit: 'bags', unitCost: 7800, criticalLevel: 10 },
    { id: 2, name: 'Maize Seed (25kg)', category: 'Seeds', quantity: 5, unit: 'bags', unitCost: 4500, criticalLevel: 2 },
    { id: 3, name: 'Diesel', category: 'Fuel', quantity: 150, unit: 'litres', unitCost: 185, criticalLevel: 50 },
    { id: 4, name: 'Chicken Feed', category: 'Feed', quantity: 20, unit: 'bags', unitCost: 3200, criticalLevel: 5 },
];


// --- PERSISTENCE & THEME LOGIC ---

function applyTheme(themeName) {
    const htmlElement = document.documentElement;
    if (htmlElement) {
        htmlElement.classList.remove('theme-green', 'theme-blue', 'theme-earth');
        htmlElement.classList.add(themeName);
        currentTheme = themeName;
        localStorage.setItem('agripulseTheme', themeName);
    }
}

function loadFields() {
    const storedFields = localStorage.getItem('agripulseUserFields');
    userFields = storedFields ? JSON.parse(storedFields) : defaultFields;
    
    // --- FIX: Robust check for currentFieldId ---
    const storedFieldId = localStorage.getItem('agripulseCurrentFieldId');
    const firstFieldId = userFields.length > 0 ? userFields[0].id : '';
    
    currentFieldId = storedFieldId || firstFieldId;
    
    // FINAL SANITY CHECK: If the loaded ID doesn't exist, reset to the first one.
    if (currentFieldId && !userFields.find(f => f.id === currentFieldId)) {
        console.warn(`Stored field ID ${currentFieldId} not found. Resetting to first field: ${firstFieldId}`);
        currentFieldId = firstFieldId;
    }
    // --- END FIX ---
    
    const storedListings = localStorage.getItem('agripulseMarketplaceListings');
    marketplaceListings = storedListings ? JSON.parse(storedListings) : marketplaceListings; 
    
    const storedTasks = localStorage.getItem('agripulseFarmTasks');
    farmTasks = storedTasks ? JSON.parse(storedTasks) : farmTasks;
    
    const storedInventory = localStorage.getItem('agripulseFarmInventory');
    farmInventory = storedInventory ? JSON.parse(storedInventory) : farmInventory;
}

function saveFields() {
    localStorage.setItem('agripulseUserFields', JSON.stringify(userFields));
    localStorage.setItem('agripulseCurrentFieldId', currentFieldId);
    localStorage.setItem('agripulseMarketplaceListings', JSON.stringify(marketplaceListings));
    localStorage.setItem('agripulseFarmTasks', JSON.stringify(farmTasks));
    localStorage.setItem('agripulseFarmInventory', JSON.stringify(farmInventory));
}

// --- CORE LOGIN FIX AND ANIMATION HOOK ---

function updateAuthState(loggedIn, name = '', email = '') {
    isLoggedIn = loggedIn;
    const authDiv = document.getElementById('auth');
    const mainAppDiv = document.getElementById('main-app');

    if (loggedIn) {
        authDiv.classList.add('fade-out-up');
        
        setTimeout(() => {
            authDiv.classList.add('hidden');
            authDiv.classList.remove('fade-out-up');
            
            mainAppDiv.classList.remove('hidden');
            mainAppDiv.classList.add('fade-in'); 
            
            // Set user info
            userName = name;
            userEmail = email;
            document.getElementById('user-name').textContent = userName;
            document.getElementById('user-email').textContent = userEmail;
            
            // Re-initialize app components
            renderContextSelector();
            switchPage('dashboard');
            localStorage.setItem('agripulseLoggedIn', 'true');
            localStorage.setItem('agripulseUserName', userName);
            localStorage.setItem('agripulseUserEmail', userEmail);
            
        }, 300); 
    } else {
        // Log out logic
        authDiv.classList.remove('hidden');
        mainAppDiv.classList.add('hidden');
        mainAppDiv.classList.remove('fade-in');
        localStorage.setItem('agripulseLoggedIn', 'false');
        // Reset current page to ensure dashboard re-initializes on next login
        switchPage('dashboard'); 
    }
}

function initializeAppState() {
    const storedLoggedIn = localStorage.getItem('agripulseLoggedIn') === 'true';
    const storedName = localStorage.getItem('agripulseUserName');
    const storedEmail = localStorage.getItem('agripulseUserEmail');

    loadFields();

    if (storedLoggedIn && storedName && storedEmail) {
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        userName = storedName;
        userEmail = storedEmail;
        document.getElementById('user-name').textContent = userName;
        document.getElementById('user-email').textContent = storedEmail; // Use storedEmail here
        
        renderContextSelector();
        switchPage('dashboard');

    } else {
        document.getElementById('auth').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    const storedTheme = localStorage.getItem('agripulseTheme');
    if (storedTheme) {
        applyTheme(storedTheme);
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = storedTheme;
        }
    } else {
        applyTheme(currentTheme); 
    }
}


// --- CORE NAVIGATION & CONTEXT SWITCHING ---

function switchPage(pageId) {
    // Destroy existing charts to prevent canvas re-use errors
    destroyCharts();
    destroyMap(); // Destroy map instance if it exists

    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active', 'fade-in');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active', 'fade-in'); 
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-secondary-active', 'text-white');
        link.classList.add('text-gray-300', 'hover:bg-secondary-hover', 'hover:text-white');
    });

    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('bg-secondary-active', 'text-white');
        activeLink.classList.remove('text-gray-300', 'hover:bg-secondary-hover', 'hover:text-white');
    }

    // Run page-specific logic/initialization
    if (pageId === 'dashboard') {
        renderDashboard();
    } else if (pageId === 'financials') {
        renderFinancialsCharts();
    } else if (pageId === 'marketplace') {
        renderPriceDiscoveryChart();
        renderMarketplace(); 
    } else if (pageId === 'tasks') {
        renderTasksPage();
    } else if (pageId === 'planning') {
        renderScenarioPlanner();
    }
    
    toggleChatModal(false);
}

function switchContext(newFieldId) {
    if (newFieldId === 'manage-fields') {
        // Placeholder for Manage Fields Modal
        document.getElementById('context-selector').value = currentFieldId;
        alert('Manage Fields modal is disabled for this demonstration.');
        return;
    }
    
    currentFieldId = newFieldId;
    saveFields();
    renderContextSelector();
    
    // Switch to active page to refresh data for new context
    const activePageElement = document.querySelector('.page-content.active');
    const activePageId = activePageElement ? activePageElement.id : 'dashboard';
    switchPage(activePageId); 
}

function renderContextSelector() {
    const selector = document.getElementById('context-selector');
    if (!selector) return;

    selector.innerHTML = ''; 

    userFields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.id;
        option.textContent = `${field.name} (${field.subtype})`;
        if (field.id === currentFieldId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    const manageOption = document.createElement('option');
    manageOption.value = 'manage-fields';
    manageOption.textContent = '-- Manage Operations --';
    selector.appendChild(manageOption);
}


// --- CHARTS & MAP MANAGEMENT ---

function destroyCharts() {
    if (yieldForecastChartInstance) yieldForecastChartInstance.destroy();
    if (moistureRainfallChartInstance) moistureRainfallChartInstance.destroy();
    if (cashFlowChartInstance) cashFlowChartInstance.destroy();
    if (priceDiscoveryChartInstance) priceDiscoveryChartInstance.destroy();
    if (scenarioChartInstance) scenarioChartInstance.destroy();
}

function destroyMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
}

// --- DYNAMIC DASHBOARD CONTENT (Map & Charts) ---

// FIX: Added defensive check to prevent LatLng error
function renderMap(field) {
    destroyMap(); // Ensure previous map is cleared

    const mapId = 'map-container';
    
    // CRITICAL FIX: Add a check for field data integrity
    if (!field || typeof field.lat !== 'number' || typeof field.lon !== 'number' || isNaN(field.lat) || isNaN(field.lon)) {
        console.error("Map initialization failed: Invalid latitude or longitude data for the current field.");
        document.getElementById(mapId).innerHTML = '<div class="text-center p-10 text-xl text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> Error: Invalid map coordinates for this field.</div>';
        return; // Exit function to prevent LatLng error
    }

    const lat = field.lat;
    const lon = field.lon;

    // Initialize map
    mapInstance = L.map(mapId, { attributionControl: false }).setView([lat, lon], 14);

    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(mapInstance);

    // Add Marker for Field Center
    L.marker([lat, lon]).addTo(mapInstance)
        .bindPopup(`<b>${field.name}</b><br>Field Center.`).openPopup();
        
    // Initial Boundary Layer
    fieldBoundaryLayer = L.polygon(field.boundary, {
        color: 'var(--color-primary)',
        fillColor: 'var(--color-primary)',
        fillOpacity: 0.2
    }).addTo(mapInstance);

    // Update coordinates display
    document.getElementById('map-coords').textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// FIX: Added robust check for currentField
function renderDashboard() {
    const currentField = userFields.find(f => f.id === currentFieldId);
    
    if (!currentField) {
        // Fallback UI when no field is selected or data is corrupted
        document.getElementById('dynamic-dashboard-content').innerHTML = `
            <div class="text-center p-10 bg-white rounded-lg shadow">
                <i class="fas fa-exclamation-circle text-5xl text-gray-400 mb-4"></i>
                <h2 class="text-2xl font-semibold text-gray-700">No Field Data Available</h2>
                <p class="text-gray-500 mt-2">Please select a valid farm operation from the dropdown menu above or check your data setup.</p>
            </div>
        `;
        document.getElementById('current-field-name').textContent = 'N/A';
        document.getElementById('current-field-type').textContent = 'N/A';
        destroyMap();
        destroyCharts();
        return; 
    }

    document.getElementById('current-field-name').textContent = currentField.name;
    document.getElementById('current-field-type').textContent = `${currentField.type} (${currentField.subtype})`;
    document.getElementById('chat-field-name').textContent = currentField.name;

    // Reset dynamic content in case it was set to an error message
    document.getElementById('dynamic-dashboard-content').innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white rounded-lg shadow p-2 transition duration-300">
                <h3 class="text-lg font-medium text-gray-800 mb-2 px-4 pt-2">Field Location & Zoning</h3>
                <div id="map-container" style="height: 350px;" class="rounded-lg"></div>
                <div class="p-4 flex items-center justify-between text-sm">
                    <div id="map-layer-controls">
                        <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs layer-btn active" data-layer="default">Default View</button>
                        <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs layer-btn" data-layer="moisture">Soil Moisture Map</button>
                    </div>
                    <p class="text-gray-500 text-xs">Lat/Lon: <span id="map-coords"></span></p>
                </div>
            </div>
            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-primary transition duration-300 context-dependent">
                    <p class="text-sm font-medium text-gray-500" id="kpi-1-title">Yield Forecast (Tons/Ha)</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1" id="kpi-1-value">...</p>
                    <div class="text-sm mt-2 text-primary" id="kpi-1-description">...</div>
                </div>
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 transition duration-300 context-dependent">
                    <p class="text-sm font-medium text-gray-500">Critical Alerts</p>
                    <p class="text-3xl font-bold text-red-500 mt-1" id="alert-count">3</p>
                    <div class="text-sm mt-2 text-red-500" id="alert-detail">Low Moisture & Fungus Risk</div>
                </div>
            </div>
        </div>
        <div id="dynamic-chart-row" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6 transition duration-300 context-dependent">
                <h3 class="text-lg font-medium text-gray-800 mb-4">Yield Forecast Trend</h3>
                <div class="chart-container" style="height: 250px;"><canvas id="yield-forecast-chart"></canvas></div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 transition duration-300 context-dependent">
                <h3 class="text-lg font-medium text-gray-800 mb-4">Soil Moisture & Rainfall (Last 7 Days)</h3>
                <div class="chart-container" style="height: 250px;"><canvas id="moisture-rainfall-chart"></canvas></div>
            </div>
        </div>
    `;

    // Set KPI values
    document.getElementById('kpi-1-title').textContent = currentField.type === 'Crop' ? 'Yield Forecast (Tons/Ha)' : 'Milk/Meat Output (Kg/day)';
    document.getElementById('kpi-1-value').textContent = currentField.type === 'Crop' ? '7.8 tons/ha' : '150 kg/day';
    document.getElementById('kpi-1-description').textContent = currentField.type === 'Crop' ? 'Projected yield based on current conditions' : 'Total collective output (Simulated)';
    
    document.getElementById('alert-count').textContent = '3';
    document.getElementById('alert-detail').textContent = 'Low Moisture & Fungus Risk';
    
    // Render Map
    renderMap(currentField);
    document.getElementById('map-layer-controls').addEventListener('click', (e) => {
        if (e.target.classList.contains('layer-btn')) {
            updateMapLayer(e.target.getAttribute('data-layer'));
        }
    });

    renderDashboardCharts();
}

function updateMapLayer(layer) {
    // Simple logic to switch map layer visualization
    const field = userFields.find(f => f.id === currentFieldId);
    if (!fieldBoundaryLayer || !mapInstance) return;

    if (layer === 'moisture') {
        fieldBoundaryLayer.setStyle({
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.5
        });
        alert('Layer switched to simulated Soil Moisture Zone view (Blue=Wet, Red=Dry - currently showing a uniform layer).');
    } else { // default
        fieldBoundaryLayer.setStyle({
            color: 'var(--color-primary)',
            fillColor: 'var(--color-primary)',
            fillOpacity: 0.2
        });
    }
    
    // Update button active state
    document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.layer-btn[data-layer="${layer}"]`).classList.add('active');
}


function renderDashboardCharts() {
    const currentField = userFields.find(f => f.id === currentFieldId);
    if (!currentField) return; // Defensive check for charts
    
    // 1. Yield Forecast Chart (Line)
    const yieldCtx = document.getElementById('yield-forecast-chart').getContext('2d');
    yieldForecastChartInstance = new Chart(yieldCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{
                label: 'Yield/Output',
                data: currentField.type === 'Crop' ? [7.0, 7.2, 7.5, 7.8, 7.6] : [140, 145, 150, 155, 150], 
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Soil Moisture & Rainfall Chart (Bar/Line Combo)
    const moistureCtx = document.getElementById('moisture-rainfall-chart').getContext('2d');
    moistureRainfallChartInstance = new Chart(moistureCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                type: 'line',
                label: 'Soil Moisture (%)',
                data: currentField.type === 'Crop' ? [35, 30, 27, 26, 28, 31, 30] : [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                yAxisID: 'y',
            },
            {
                type: 'bar',
                label: 'Rainfall (mm)',
                data: currentField.type === 'Crop' ? [5, 10, 0, 0, 3, 12, 5] : [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(52, 211, 153, 0.7)',
                yAxisID: 'y1'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: {y: { type: 'linear', position: 'left' }, y1: { type: 'linear', position: 'right' }}}
    });
}

function renderFinancialsCharts() {
    // 3. Monthly Cash Flow Chart (Bar)
    const financialCtx = document.getElementById('cash-flow-chart').getContext('2d');
    cashFlowChartInstance = new Chart(financialCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Income (KSh M)',
                data: [1.5, 1.8, 1.2, 2.0, 1.9, 2.5, 3.0], 
                backgroundColor: 'var(--color-primary)',
            },
            {
                label: 'Expenses (KSh M)',
                data: [0.8, 1.0, 0.9, 1.1, 1.2, 1.3, 1.5],
                backgroundColor: '#EF4444',
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
    });
}

function renderPriceDiscoveryChart() {
    // 4. Local Price Discovery Chart (Line)
    const priceCtx = document.getElementById('price-discovery-chart').getContext('2d');
    priceDiscoveryChartInstance = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Local Maize Price (KSh/Bag)',
                data: [3800, 3850, 3900, 3900, 4000, 3950, 3980], 
                borderColor: '#3B82F6',
                tension: 0.4,
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// --- PLANNING & MODELING LOGIC (Scenario Planner) ---

function calculateScenarioYield(rainfall, fertilizer, pest) {
    // Simple simulation logic: Base Yield (7.0) + Fertilizer Bonus - Pest Penalty + Rain Bonus
    let baseYield = 7.0;
    let fertilizerBonus = 0;
    if (fertilizer === 'medium') fertilizerBonus = 1.0;
    if (fertilizer === 'high') fertilizerBonus = 1.5;
    if (fertilizer === 'premium') fertilizerBonus = 2.0;
    
    const pestPenalty = pest * 0.2; // 0-10 scale
    const rainBonus = rainfall * 0.05; // 0-100 scale

    let newYield = baseYield + fertilizerBonus + rainBonus - pestPenalty;
    
    // Ensure yield is reasonable
    newYield = Math.min(newYield, 12);
    newYield = Math.max(newYield, 5);

    return parseFloat(newYield.toFixed(1));
}

function renderScenarioPlanner() {
    const rainfallInput = document.getElementById('model-rainfall');
    const fertilizerSelect = document.getElementById('model-fertilizer');
    const pestInput = document.getElementById('model-pest');
    const runModelBtn = document.getElementById('run-model-btn');
    
    const updateScenarioChart = () => {
        const rainfall = parseInt(rainfallInput.value);
        const fertilizer = fertilizerSelect.value;
        const pest = parseInt(pestInput.value);
        
        document.getElementById('model-rainfall-val').textContent = `${rainfall} mm`;
        document.getElementById('model-pest-val').textContent = `${pest} (Risk)`;

        const newYield = calculateScenarioYield(rainfall, fertilizer, pest);
        const baselineYield = 7.8; 
        const difference = newYield - baselineYield;
        const percentageChange = ((difference / baselineYield) * 100).toFixed(1);

        document.querySelector('#planning .text-2xl').textContent = `${newYield} tons/ha`;
        document.getElementById('scenario-summary').innerHTML = `
            Based on your inputs, the projected yield is **${newYield} tons/ha**. 
            This represents a **${difference > 0 ? '+' : ''}${percentageChange}% change** compared to the current baseline forecast.
        `;

        // Update Chart
        if (scenarioChartInstance) scenarioChartInstance.destroy();
        const scenarioCtx = document.getElementById('scenario-chart').getContext('2d');
        scenarioChartInstance = new Chart(scenarioCtx, {
            type: 'bar',
            data: {
                labels: ['Current Baseline', 'New Scenario'],
                datasets: [{
                    label: 'Yield (tons/ha)',
                    data: [baselineYield, newYield],
                    backgroundColor: ['#4B5563', 'var(--color-primary)'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 5, max: 10 } } }
        });
    };

    rainfallInput.oninput = updateScenarioChart;
    fertilizerSelect.onchange = updateScenarioChart;
    pestInput.oninput = updateScenarioChart;
    runModelBtn.onclick = updateScenarioChart;
    
    updateScenarioChart(); // Initial render
}


// --- TASK & INVENTORY LOGIC ---

function renderTasksPage() {
    const taskContainer = document.getElementById('tasks-list');
    taskContainer.innerHTML = '';
    
    // Filter tasks for the current field and sort by date
    const today = new Date().toISOString().split('T')[0];

    farmTasks
        .filter(t => t.fieldId === currentFieldId)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(task => {
            let priorityColor, priorityText;
            if (task.priority === 'high') { priorityColor = 'bg-red-100 text-red-800'; priorityText = 'High'; }
            else if (task.priority === 'medium') { priorityColor = 'bg-yellow-100 text-yellow-800'; priorityText = 'Medium'; }
            else { priorityColor = 'bg-blue-100 text-blue-800'; priorityText = 'Low'; }
            
            let statusBadge = task.completed 
                ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"><i class="fas fa-check"></i> Done</span>'
                : (task.date < today ? '<span class="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full"><i class="fas fa-exclamation-triangle"></i> OVERDUE</span>' : `<span class="px-2 py-1 text-xs font-medium ${priorityColor} rounded-full">${priorityText} Priority</span>`);

            let recommendedTag = task.recommended ? '<i class="fas fa-robot text-blue-500 ml-2" title="AI Recommended Task"></i>' : '';

            const taskHtml = `
                <div class="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition duration-300 hover:bg-white">
                    <div class="flex items-center space-x-3">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} class="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" onchange="toggleTaskCompletion(${task.id})">
                        <div>
                            <p class="font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}">${task.title} ${recommendedTag}</p>
                            <p class="text-sm text-gray-500">Due: ${task.date}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        ${statusBadge}
                        <button onclick="deleteTask(${task.id})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
            taskContainer.insertAdjacentHTML('beforeend', taskHtml);
        });
        
    renderInventoryOverview();
}

function toggleTaskCompletion(taskId) {
    const task = farmTasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveFields();
        renderTasksPage();
    }
}

function deleteTask(taskId) {
    farmTasks = farmTasks.filter(t => t.id !== taskId);
    saveFields();
    renderTasksPage();
}

function addNewTask(event) {
    event.preventDefault();
    const title = document.getElementById('task-title').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;

    const newTask = {
        id: Date.now(),
        fieldId: currentFieldId,
        title,
        date,
        priority,
        completed: false,
        recommended: false
    };

    farmTasks.push(newTask);
    saveFields();
    document.getElementById('add-task-modal').classList.add('hidden');
    document.getElementById('add-task-form').reset();
    renderTasksPage();
    alert(`Task "${title}" created for ${userFields.find(f => f.id === currentFieldId).name}.`);
}

function renderInventoryOverview() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    
    // Sort by critical items first
    farmInventory
        .sort((a, b) => (a.quantity <= a.criticalLevel ? -1 : 1) - (b.quantity <= b.criticalLevel ? -1 : 1))
        .slice(0, 3) // Show top 3 critical items
        .forEach(item => {
            const isCritical = item.quantity <= item.criticalLevel;
            const bgColor = isCritical ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300';
            const icon = isCritical ? 'fas fa-exclamation-triangle text-red-500' : 'fas fa-box-open text-green-500';
            
            const itemHtml = `
                <div class="p-3 ${bgColor} rounded-lg border flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i class="${icon} text-xl"></i>
                        <div>
                            <p class="font-medium text-gray-800">${item.name}</p>
                            <p class="text-xs text-gray-500">${item.category}</p>
                        </div>
                    </div>
                    <p class="font-bold ${isCritical ? 'text-red-600' : 'text-green-600'}">${item.quantity} ${item.unit}</p>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHtml);
        });
}

function renderFullInventoryTable() {
    const container = document.getElementById('inventory-full-list');
    
    const tableRows = farmInventory.map(item => {
        const isCritical = item.quantity <= item.criticalLevel;
        const statusClass = isCritical ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity} ${item.unit}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.criticalLevel} ${item.unit}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${isCritical ? 'CRITICAL LOW' : 'OK'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900" onclick="alert('Editing ${item.name}...');">Edit</button>
                </td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty on Hand</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical Level</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${tableRows}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHtml;
}


// --- CROP DOCTOR / UPLOAD LOGIC (Remains the same as previous step) ---

function displayDiagnosisResult(disease, likelihood, cause, treatment, vendor) {
    document.getElementById('diag-disease').textContent = disease;
    document.getElementById('diag-likelihood').textContent = `Likelihood: ${likelihood}`;
    document.getElementById('diag-treatment').textContent = treatment;
    document.getElementById('diag-source').innerHTML = `The recommended medication is supplied by: <strong>${vendor.seller}</strong>.`;
    suggestedVendorId = vendor.id;

    const linkBtn = document.getElementById('link-to-marketplace-btn');
    linkBtn.classList.remove('hidden');
    linkBtn.onclick = () => {
        switchPage('marketplace');
    }

    const shareTitle = document.querySelector('#share-modal h3');
    if (shareTitle) shareTitle.textContent = `Share Report: ${disease}`;

    document.getElementById('diagnosis-result').classList.remove('hidden');
    document.getElementById('diagnosis-result').classList.add('fade-in'); 
}

function uploadFile(file) {
    const preview = document.getElementById('crop-image-preview');
    const placeholder = document.getElementById('crop-preview-placeholder');
    const dropArea = document.getElementById('crop-doctor-drop-area');

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            dropArea.classList.remove('active');
        };
        reader.readAsDataURL(file);
        
        const suggestedVendor = marketplaceListings.find(l => l.id === 'list-1'); 

        setTimeout(() => {
            displayDiagnosisResult(
                "Maize Leaf Blight", 
                "90% (High Severity)", 
                "Caused by the fungus *Exserohilum turcicum*.", 
                "Immediate application of a broad-spectrum fungicide (Active Ingredient: Azoxystrobin) at a recommended rate of 1.0 L/Ha.", 
                suggestedVendor
            );
            // After successful diagnosis, recommend task
            alert('AI automatically added an "Apply Fungicide" task to your planner!');
            farmTasks.push({ id: Date.now(), fieldId: currentFieldId, title: 'Apply Fungicide (Azoxystrobin)', date: new Date().toISOString().split('T')[0], priority: 'high', completed: false, recommended: true });
            saveFields();
        }, 1500);
    } else {
        alert("Please upload a valid image file.");
    }
    document.getElementById('crop-doctor-input').value = '';
}


// --- MARKETPLACE LOGIC (Remains the same as previous step) ---

function renderMarketplace() {
    const container = document.getElementById('marketplace-listings-container');
    const loadingMessage = document.getElementById('marketplace-loading-message');
    const searchInput = document.getElementById('marketplace-search').value.toLowerCase();
    const filterValue = document.getElementById('marketplace-filter').value;

    loadingMessage.classList.remove('hidden');
    container.innerHTML = '';
    
    setTimeout(() => {
        loadingMessage.classList.add('hidden');
        
        let filteredListings = marketplaceListings.filter(item => {
            const categoryMatch = filterValue === 'all' || item.category === filterValue;
            const searchMatch = item.title.toLowerCase().includes(searchInput) || item.description.toLowerCase().includes(searchInput) || item.seller.toLowerCase().includes(searchInput);
            return categoryMatch && searchMatch;
        });

        if (filteredListings.length === 0) {
             container.innerHTML = `<p class="text-gray-500 text-center col-span-full py-10">No listings found matching your criteria.</p>`;
             return;
        }

        filteredListings.forEach(item => {
            const isRecommended = item.id === suggestedVendorId ? '<span class="text-red-600 font-bold ml-2"><i class="fas fa-star mr-1"></i> Recommended</span>' : '';
            const itemHtml = `
                <div class="bg-white rounded-lg shadow p-4 border border-gray-100 transition duration-300 hover:shadow-xl">
                    <img src="${item.img || 'https://via.placeholder.com/400x200?text=AgriPulse+Product'}" alt="${item.title}" class="w-full h-32 object-cover rounded mb-3">
                    <h4 class="text-lg font-semibold text-gray-800 truncate">${item.title} ${isRecommended}</h4>
                    <p class="text-xl font-bold text-primary mt-1">Ksh ${item.price.toLocaleString()}</p>
                    <p class="text-sm text-gray-500 mt-1">Seller: ${item.seller}</p>
                    <button class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md contact-seller-btn"
                        data-id="${item.id}" 
                        data-seller="${item.seller}" 
                        data-email="${item.email}" 
                        data-whatsapp="${item.whatsapp || ''}" 
                        data-phone="${item.phone || ''}"
                        data-title="${item.title}">
                        <i class="fas fa-comments mr-2"></i> Contact
                    </button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHtml);
        });
    }, 500);
}

function openContactModal(listingId, sellerName, email, whatsapp, phone, title) {
    document.getElementById('contact-seller-name').textContent = sellerName;
    document.getElementById('contact-listing-title').textContent = title;
    
    const emailLink = document.getElementById('contact-email-link');
    emailLink.href = `mailto:${email}`;
    document.getElementById('contact-email-text').textContent = email;

    const whatsappLink = document.getElementById('contact-whatsapp-link');
    const phoneLink = document.getElementById('contact-phone-link');
    const noPhoneText = document.getElementById('contact-no-phone');

    if (whatsapp) {
        whatsappLink.href = `https://wa.me/${whatsapp}`; 
        whatsappLink.classList.remove('hidden');
    } else {
        whatsappLink.classList.add('hidden');
    }

    if (phone) {
        phoneLink.href = `tel:${phone}`;
        document.getElementById('contact-phone-text').textContent = phone;
        phoneLink.classList.remove('hidden');
        noPhoneText.classList.add('hidden');
    } else {
        phoneLink.classList.add('hidden');
        noPhoneText.classList.remove('hidden');
    }

    document.getElementById('contact-modal').classList.remove('hidden');
}


function postNewListing(event) {
    event.preventDefault();
    const title = document.getElementById('listing-title').value;
    const price = parseInt(document.getElementById('listing-price').value);
    const category = document.getElementById('listing-category').value;
    const description = document.getElementById('listing-description').value;

    const newListing = {
        id: 'list-' + Date.now(),
        title,
        category,
        price,
        description,
        seller: userName,
        email: userEmail,
        whatsapp: '+254701234567', 
        phone: '0712345678', 
        img: 'https://via.placeholder.com/400x200?text=New+Listing'
    };

    marketplaceListings.unshift(newListing); 
    saveFields();
    document.getElementById('post-listing-modal').classList.add('hidden');
    document.getElementById('post-listing-form').reset();
    renderMarketplace();
    alert(`Listing "${title}" posted successfully!`);
}


// --- CHATBOT LOGIC (Remains the same as previous step) ---

function toggleChatModal(show) {
    const modal = document.getElementById('chat-modal-container');
    const doodle = document.getElementById('floating-chat-doodle');
    if (show) {
        modal.classList.remove('hidden');
        doodle.classList.add('hidden');
    } else {
        modal.classList.add('hidden');
        doodle.classList.remove('hidden');
    }
}

function addMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble ${sender}-bubble`;

    text.split('\n').filter(p => p.trim() !== '').forEach((paragraph, index) => {
        const p = document.createElement('p');
        if (index > 0) p.className = 'mt-2';
        p.textContent = paragraph;
        messageDiv.appendChild(p);
    });

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-bubble ai-bubble typing-indicator';
    typingDiv.innerHTML = '<p class="loading-dots">AgriBot is typing</p>';
    typingDiv.id = 'typing-indicator';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function simulateAiResponse(userMessage) {
    addTypingIndicator();

    setTimeout(() => {
        removeTypingIndicator();
        let aiResponse = "I'm processing your request. Please ask for data on yield, soil, weather, or marketplace assistance.";

        const lowerCaseMessage = userMessage.toLowerCase();
        const currentField = userFields.find(f => f.id === currentFieldId);

        if (lowerCaseMessage.includes('irrigate') || lowerCaseMessage.includes('water')) {
            aiResponse = `The **Soil Moisture for ${currentField.name} is 27% (Low)**. I recommend initiating irrigation for 12 hours starting tonight, then checking the moisture level again tomorrow morning.`;
        } else if (lowerCaseMessage.includes('mortality') && currentField.type === 'Livestock') {
            aiResponse = `The daily mortality rate for **${currentField.name}** is **0.15%**, which is below the target of 0.2%. Excellent management!`;
        } else if (lowerCaseMessage.includes('fungicide')) {
            aiResponse = "I have checked the Marketplace and found **Azoxystrobin Fungicide (1L)** from AgroChemicals Ltd. available for **Ksh 5,500**. Do you want me to navigate you to their listing?";
        }

        addMessage(aiResponse, 'ai');
    }, 1500);
}

// --- EVENT LISTENERS & INITIALIZATION ---

document.addEventListener('DOMContentLoaded', function() {
    
    initializeAppState(); 
    
    // --- Authentication Listeners ---
    document.getElementById('auth-form').addEventListener('submit', function(e) {
        e.preventDefault(); 
        const modeInput = document.getElementById('auth-mode');
        const password = document.getElementById('password').value;
        let name = document.getElementById('full-name').value || 'New User'; 
        if (password.length < 6) { alert('Password must be at least 6 characters long.'); return;}
        updateAuthState(true, name, document.getElementById('email-address').value);
    });
    
    document.getElementById('toggle-auth-mode').addEventListener('click', function() {
        const modeInput = document.getElementById('auth-mode');
        const title = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const nameField = document.getElementById('name-field');

        if (modeInput.value === 'login') {
            modeInput.value = 'signup';
            title.textContent = 'Create a new account';
            submitBtn.innerHTML = 'Sign Up';
            this.innerHTML = "Already have an account? Sign In";
            nameField.classList.remove('hidden');
        } else {
            modeInput.value = 'login';
            title.textContent = 'Sign In to your account';
            submitBtn.innerHTML = 'Sign In';
            this.innerHTML = "Don't have an account? Sign Up";
            nameField.classList.add('hidden');
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        updateAuthState(false);
    });

    // --- Sidebar Navigation Listener (This should now work due to error fixes) ---
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (isLoggedIn) {
                document.getElementById('diagnosis-result').classList.add('hidden'); 
                document.getElementById('link-to-marketplace-btn').classList.add('hidden'); 
                switchPage(this.getAttribute('data-page'));
            } else {
                alert('Please sign in to access the dashboard.');
            }
        });
    });
    
    // --- Context Selector Listener ---
    const contextSelector = document.getElementById('context-selector');
    if (contextSelector) {
        contextSelector.addEventListener('change', function() {
            switchContext(this.value);
        });
    }
    
    // --- Settings / Theme Listener ---
    const themeSelector = document.getElementById('theme-selector');
    if(themeSelector) {
        themeSelector.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
    
    // --- Floating Chat Doodle Listeners ---
    const floatingDoodle = document.getElementById('floating-chat-doodle');
    const closeChatModalBtn = document.getElementById('close-chat-modal');

    if (floatingDoodle) {
        floatingDoodle.addEventListener('click', () => toggleChatModal(true));
    }
    if (closeChatModalBtn) {
        closeChatModalBtn.addEventListener('click', () => toggleChatModal(false));
    }
    
    // --- Chatbot Form Listener ---
    const chatForm = document.getElementById('chat-form');
    if (chatForm) { 
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const userMessage = input.value.trim();
            if (userMessage) {
                addMessage(userMessage, 'user');
                input.value = '';
                simulateAiResponse(userMessage);
            }
        });
    }
    
    // --- Crop Doctor File Upload Listeners ---
    const cropDoctorInput = document.getElementById('crop-doctor-input');
    const dropArea = document.getElementById('crop-doctor-drop-area');
    if (cropDoctorInput) { 
        cropDoctorInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            uploadFile(file);
        });
    }

    // Drag and Drop implementation
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('active'), false);
        });

        dropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                uploadFile(files[0]);
            }
        }, false);
    }
    
    // --- Share Modal Listeners (For WhatsApp/Email) ---
    const shareResultBtn = document.getElementById('share-result-btn');
    const shareModal = document.getElementById('share-modal');

    if (shareResultBtn) {
        shareResultBtn.addEventListener('click', () => {
            shareModal.classList.remove('hidden');
        });
    }
    document.getElementById('close-share-modal').addEventListener('click', () => shareModal.classList.add('hidden'));

    document.getElementById('send-email-btn').addEventListener('click', () => {
        alert(`Simulating PDF report sent to: ${document.getElementById('share-email').value}`);
        shareModal.classList.add('hidden');
    });
    document.getElementById('send-whatsapp-btn').addEventListener('click', () => {
        const whatsappNumber = document.getElementById('share-whatsapp').value;
        window.open(`https://wa.me/${whatsappNumber}?text=Hello! Here is the AgriPulse Diagnosis Report PDF link: [Simulated Link]`, '_blank');
        shareModal.classList.add('hidden');
    });

    
    // --- Marketplace Listeners ---
    document.getElementById('close-contact-modal').addEventListener('click', () => document.getElementById('contact-modal').classList.add('hidden'));
    document.getElementById('marketplace-search').addEventListener('input', renderMarketplace);
    document.getElementById('marketplace-filter').addEventListener('change', renderMarketplace);
    document.getElementById('post-listing-btn').addEventListener('click', () => {
        document.getElementById('post-listing-modal').classList.remove('hidden');
    });
    document.getElementById('close-post-listing-modal').addEventListener('click', () => {
        document.getElementById('post-listing-modal').classList.add('hidden');
        document.getElementById('post-listing-form').reset();
    });
    document.getElementById('post-listing-form').addEventListener('submit', postNewListing);
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('contact-seller-btn')) {
            const item = marketplaceListings.find(l => l.id === e.target.getAttribute('data-id'));
            if (item) {
                openContactModal(item.id, item.seller, item.email, item.whatsapp, item.phone, item.title);
            }
        }
    });
    
    // --- Tasks & Inventory Listeners ---
    document.getElementById('add-task-btn').addEventListener('click', () => {
        document.getElementById('add-task-modal').classList.remove('hidden');
    });
    document.getElementById('close-add-task-modal').addEventListener('click', () => {
        document.getElementById('add-task-modal').classList.add('hidden');
        document.getElementById('add-task-form').reset();
    });
    document.getElementById('add-task-form').addEventListener('submit', addNewTask);

    document.getElementById('manage-inventory-btn').addEventListener('click', () => {
        renderFullInventoryTable();
        document.getElementById('inventory-modal').classList.remove('hidden');
    });
    document.getElementById('close-inventory-modal').addEventListener('click', () => {
        document.getElementById('inventory-modal').classList.add('hidden');
    });
});