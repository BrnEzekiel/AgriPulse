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


// --- MOBILE SIDEBAR LOGIC ---
function toggleSidebar(show) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;

    // Default to toggle if no argument is provided
    if (show === undefined) {
        show = sidebar.classList.contains('-translate-x-full');
    }

    if (show) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.add('active');
        document.body.classList.add('overflow-hidden'); 
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
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
    
    // New: Close mobile sidebar after navigation
    if (window.innerWidth < 1024) { 
        toggleSidebar(false);
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

    // Also populate the task field selector and default field setting
    const taskFieldSelector = document.getElementById('task-field');
    const defaultFieldSelector = document.getElementById('default-field');
    if (taskFieldSelector) {
        taskFieldSelector.innerHTML = '';
        userFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.id;
            option.textContent = `${field.name} (${field.subtype})`;
            taskFieldSelector.appendChild(option);
        });
    }
    if (defaultFieldSelector) {
        defaultFieldSelector.innerHTML = '';
        userFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.id;
            option.textContent = `${field.name} (${field.subtype})`;
            if (field.id === currentFieldId) {
                option.selected = true;
            }
            defaultFieldSelector.appendChild(option);
        });
    }
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
    if (document.getElementById('initial-chat-field')) {
        document.getElementById('initial-chat-field').textContent = currentField.name;
    }


    // Reset dynamic content in case it was set to an error message
    // NOTE: This re-renders the original structure inside the content div.
    document.getElementById('dynamic-dashboard-content').innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white rounded-lg shadow p-2 transition duration-300">
                <h3 class="text-lg font-medium text-gray-800 mb-2 px-4 pt-2">Field Location & Zoning</h3>
                <div id="map-container" style="height: 350px;" class="rounded-lg"></div>
                <div class="p-4 flex items-center justify-between text-sm flex-wrap">
                    <div id="map-layer-controls" class="mb-2 sm:mb-0">
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
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 2. Soil Moisture & Rainfall Chart (Bar/Line Combo)
    const moistureCtx = document.getElementById('moisture-rainfall-chart').getContext('2d');
    moistureRainfallChartInstance = new Chart(moistureCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    type: 'line',
                    label: 'Soil Moisture (%)',
                    data: currentField.type === 'Crop' ? [35, 30, 27, 26, 28, 31, 30] : [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    yAxisID: 'y1',
                    tension: 0.4
                },
                {
                    type: 'bar',
                    label: 'Rainfall (mm)',
                    data: [1, 0, 5, 20, 0, 0, 3],
                    backgroundColor: '#1F2937',
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Moisture (%)' },
                    max: 40
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Rainfall (mm)' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}


// --- FINANCIALS PAGE LOGIC ---

function renderFinancialsCharts() {
    // 1. Cash Flow Projection (Bar)
    const cashFlowCtx = document.getElementById('cash-flow-chart').getContext('2d');
    cashFlowChartInstance = new Chart(cashFlowCtx, {
        type: 'bar',
        data: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
            datasets: [
                {
                    label: 'Income (KES K)',
                    data: [450, 600, 300, 750, 500, 800],
                    backgroundColor: 'var(--color-primary)',
                },
                {
                    label: 'Expenses (KES K)',
                    data: [200, 250, 180, 400, 220, 350],
                    backgroundColor: '#EF4444',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: false },
                y: { stacked: false }
            }
        }
    });

    // 2. Cost of Production Breakdown (Doughnut)
    const costBreakdownCtx = document.getElementById('cost-breakdown-chart').getContext('2d');
    new Chart(costBreakdownCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fertilizer', 'Labour', 'Fuel/Energy', 'Chemicals', 'Other'],
            datasets: [{
                data: [35, 25, 15, 10, 15],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
    
    // 3. Revenue by Field/Operation (Pie)
    const revenueByFieldCtx = document.getElementById('revenue-by-field-chart').getContext('2d');
    new Chart(revenueByFieldCtx, {
        type: 'pie',
        data: {
            labels: ['Maize Field 1', 'Poultry Coop 1', 'Horticulture Plot'],
            datasets: [{
                data: [60, 30, 10],
                backgroundColor: ['#059669', '#2563EB', '#A16207'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}


// --- MARKETPLACE & PRICE DISCOVERY LOGIC ---

function renderPriceDiscoveryChart() {
    const priceCtx = document.getElementById('price-discovery-chart').getContext('2d');
    priceDiscoveryChartInstance = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            datasets: [
                {
                    label: 'Local Price (KES/90kg)',
                    data: [3500, 3600, 3700, 3800, 3900, 3850, 3800, 3950, 4000, 3800],
                    borderColor: 'var(--color-primary)',
                    tension: 0.2,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'National Average',
                    data: [3700, 3750, 3850, 3900, 3950, 3900, 3850, 4000, 4050, 3900],
                    borderColor: '#9CA3AF',
                    borderDash: [5, 5],
                    tension: 0.2,
                    fill: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderMarketplace() {
    const container = document.getElementById('marketplace-listings');
    container.innerHTML = ''; // Clear previous listings

    marketplaceListings.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden transition duration-300 hover:shadow-xl border border-gray-100';
        
        card.innerHTML = `
            <div class="p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold uppercase px-2 py-0.5 rounded-full text-white ${item.category === 'pesticide' ? 'bg-red-500' : item.category === 'fertilizer' ? 'bg-blue-500' : 'bg-gray-500'}">${item.category}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800">${item.title}</h3>
                <p class="text-2xl font-extrabold text-primary my-2">KES ${item.price.toLocaleString()}</p>
                <p class="text-sm text-gray-600 mb-4">${item.description}</p>
                <p class="text-xs text-gray-500 mb-4 italic">Sold by: ${item.seller}</p>
                
                <button class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium text-sm transition duration-300 contact-seller-btn" data-id="${item.id}">
                    <i class="fas fa-handshake mr-2"></i> Contact Seller
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function postNewListing(e) {
    e.preventDefault();
    
    const title = document.getElementById('listing-title').value;
    const category = document.getElementById('listing-category').value;
    const price = parseInt(document.getElementById('listing-price').value, 10);
    const description = document.getElementById('listing-description').value;

    const newId = `list-${marketplaceListings.length + 1}`;
    
    // Simulate current user posting the listing
    const newListing = {
        id: newId, 
        title: title, 
        category: category, 
        price: price, 
        description: description,
        seller: userName, 
        email: userEmail, 
        whatsapp: '254700000000', 
        phone: '000000000', 
        img: 'https://images.unsplash.com/photo-1549487950-8a719c2f689e?w=400'
    };

    marketplaceListings.unshift(newListing); 
    saveFields();
    
    // Close and rerender
    document.getElementById('post-listing-modal').classList.add('hidden');
    document.getElementById('post-listing-form').reset();
    renderMarketplace();
    alert('Your listing has been posted successfully!');
}

function openContactModal(id, seller, email, whatsapp, phone, title) {
    document.getElementById('contact-modal-title').textContent = `Contact Seller for ${title}`;
    document.getElementById('contact-modal-seller').textContent = `Seller: ${seller}`;
    
    document.getElementById('contact-email').href = `mailto:${email}`;
    document.getElementById('contact-email-val').textContent = email;
    
    document.getElementById('contact-whatsapp').href = `https://wa.me/${whatsapp}`;
    document.getElementById('contact-whatsapp-val').textContent = whatsapp;
    
    document.getElementById('contact-phone').href = `tel:${phone}`;
    document.getElementById('contact-phone-val').textContent = phone;
    
    document.getElementById('contact-modal').classList.remove('hidden');
    suggestedVendorId = id; 
}


// --- TASKS & INVENTORY LOGIC ---

function renderTasksPage() {
    renderTaskList();
    renderInventorySummary();
}

function renderTaskList() {
    const taskList = document.getElementById('tasks-list');
    if (!taskList) return;
    taskList.innerHTML = '';
    
    // Filter and Sort tasks by completion and date
    const sortedTasks = farmTasks
        .filter(t => t.fieldId === currentFieldId) // Only show tasks for the current field
        .sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.date) - new Date(b.date);
        });

    if (sortedTasks.length === 0) {
        taskList.innerHTML = '<p class="text-gray-500 italic p-4 text-center">No tasks scheduled for this operation. Add one now!</p>';
        return;
    }

    sortedTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = `flex items-center p-3 rounded-lg shadow-sm border ${task.completed ? 'bg-green-50 border-green-200' : task.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`;
        
        const badgeColor = task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500';
        
        item.innerHTML = `
            <input type="checkbox" class="form-checkbox h-5 w-5 ${task.completed ? 'text-green-600' : 'text-primary'}" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
            <div class="ml-4 flex-grow">
                <p class="font-medium text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</p>
                <div class="flex items-center space-x-3 text-xs text-gray-500">
                    <span class="${badgeColor} text-white px-2 py-0.5 rounded-full uppercase">${task.priority}</span>
                    <span>Due: ${task.date}</span>
                    ${task.recommended ? '<span class="text-primary font-semibold"><i class="fas fa-magic mr-1"></i> AI Recommended</span>' : ''}
                </div>
            </div>
        `;
        taskList.appendChild(item);
    });

    // Add event listener to handle task completion
    taskList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = parseInt(e.target.getAttribute('data-task-id'), 10);
            const task = farmTasks.find(t => t.id === taskId);
            if (task) {
                task.completed = e.target.checked;
                saveFields();
                renderTaskList(); // Re-render to update classes/sorting
            }
        });
    });
}

function addNewTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const fieldId = document.getElementById('task-field').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;

    const newId = farmTasks.length > 0 ? Math.max(...farmTasks.map(t => t.id)) + 1 : 1;

    const newTask = {
        id: newId,
        fieldId: fieldId,
        title: title,
        date: date,
        priority: priority,
        completed: false,
        recommended: false
    };

    farmTasks.push(newTask);
    saveFields();

    document.getElementById('add-task-modal').classList.add('hidden');
    document.getElementById('add-task-form').reset();
    renderTaskList();
    alert('Task created successfully!');
}

function renderInventorySummary() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    inventoryList.innerHTML = '';

    const criticalItems = farmInventory.filter(item => item.quantity <= item.criticalLevel);

    if (criticalItems.length === 0) {
        inventoryList.innerHTML = '<p class="text-green-600 font-medium p-4 text-center"><i class="fas fa-check-circle mr-2"></i> All critical inventory levels are adequate.</p>';
        return;
    }

    criticalItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded-md';
        itemDiv.innerHTML = `
            <div>
                <p class="font-medium text-red-800">${item.name} (${item.category})</p>
                <p class="text-sm text-red-600">Only ${item.quantity} ${item.unit} left. Critical level is ${item.criticalLevel}.</p>
            </div>
            <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
        `;
        inventoryList.appendChild(itemDiv);
    });
}

function renderFullInventoryTable() {
    const tableContainer = document.getElementById('inventory-full-list');
    if (!tableContainer) return;
    
    // Create the table structure
    let tableHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical Level</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
    `;

    farmInventory.forEach(item => {
        const isCritical = item.quantity <= item.criticalLevel;
        tableHTML += `
            <tr class="${isCritical ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${isCritical ? 'text-red-900' : 'text-gray-900'}">${item.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${isCritical ? 'text-red-700 font-bold' : 'text-gray-500'}">${item.quantity} ${item.unit}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.criticalLevel} ${item.unit}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES ${item.unitCost.toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-2" data-id="${item.id}" onclick="alert('Simulated: Edit item ${item.name}')">Edit</button>
                    <button class="text-primary hover:text-green-900" data-id="${item.id}" onclick="alert('Simulated: Add stock for ${item.name}')">Restock</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// --- CROP DOCTOR / UPLOAD LOGIC ---

function setupCropDoctorListeners() {
    const dropArea = document.getElementById('crop-doctor-drop-area');
    const fileInput = document.getElementById('crop-photo-upload');
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview');
    const removeBtn = document.getElementById('remove-photo-btn');
    const diagnosisStatus = document.getElementById('diagnosis-status');
    const runDiagnosisBtn = document.getElementById('run-diagnosis-btn');

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please drop an image file (JPEG or PNG).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size exceeds 10MB limit.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.classList.remove('hidden');
            dropArea.classList.add('hidden');
            diagnosisStatus.textContent = 'Photo uploaded. Ready for diagnosis.';
            runDiagnosisBtn.classList.remove('hidden');
            runDiagnosisBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Drag and Drop Handlers
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
        const file = dt.files[0];
        handleFile(file);
    }, false);

    // Click Handler
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });
    
    // Remove Photo Handler
    removeBtn.addEventListener('click', () => {
        previewContainer.classList.add('hidden');
        dropArea.classList.remove('hidden');
        fileInput.value = '';
        diagnosisStatus.textContent = 'Upload a photo to start analysis.';
        runDiagnosisBtn.classList.add('hidden');
        runDiagnosisBtn.disabled = true;
    });

    // Run Diagnosis Handler
    runDiagnosisBtn.addEventListener('click', () => {
        diagnosisStatus.textContent = 'Running deep-learning diagnosis...';
        runDiagnosisBtn.disabled = true;

        setTimeout(() => {
            diagnosisStatus.innerHTML = `
                <p class="text-green-600 font-bold">Diagnosis Complete:</p>
                <p class="mt-2 text-sm">Detected Issue: **Maize Leaf Blight (Fungus)**</p>
                <p class="mt-2 text-sm">Severity: **High** (75% of leaf area affected)</p>
                <p class="mt-2 text-sm">Recommendation: **Immediate application of Azoxystrobin fungicide.** See Marketplace for vendors.</p>
            `;
            runDiagnosisBtn.textContent = 'Run New Diagnosis';
            runDiagnosisBtn.disabled = false;
            runDiagnosisBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            runDiagnosisBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 3000); 
    });
    
    // Batch Upload Handler (Simulated)
    const batchFileInput = document.getElementById('batch-upload-file');
    const runBatchUploadBtn = document.getElementById('run-batch-upload');
    const batchUploadStatus = document.getElementById('batch-upload-status');

    batchFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            runBatchUploadBtn.disabled = false;
            batchUploadStatus.textContent = `File selected: ${e.target.files[0].name}. Click Process Batch to upload.`;
        } else {
            runBatchUploadBtn.disabled = true;
            batchUploadStatus.textContent = '';
        }
    });

    runBatchUploadBtn.addEventListener('click', () => {
        batchUploadStatus.textContent = 'Processing batch data... This may take a moment.';
        runBatchUploadBtn.disabled = true;
        
        setTimeout(() => {
            batchUploadStatus.innerHTML = '<span class="text-green-600 font-medium">Batch upload complete!</span> 540 new sensor data points and 12 historical yield records imported.';
            runBatchUploadBtn.disabled = false;
            batchFileInput.value = ''; // Reset file input
        }, 4000);
    });
}


// --- PLANNING PAGE LOGIC ---

function renderScenarioPlanner() {
    const fertRateInput = document.getElementById('fert-rate');
    const fertRateDisplay = document.getElementById('fert-rate-display');
    const irrigationLevelInput = document.getElementById('irrigation-level');
    const irrigationLevelDisplay = document.getElementById('irrigation-level-display');

    const updateDisplays = () => {
        fertRateDisplay.textContent = `${fertRateInput.value} kg/ha`;
        irrigationLevelDisplay.textContent = `${irrigationLevelInput.value}%`;
    };

    fertRateInput.addEventListener('input', updateDisplays);
    irrigationLevelInput.addEventListener('input', updateDisplays);
    
    // Initial display update
    updateDisplays();

    // Render charts
    renderScenarioChart();
    renderPrecipitationForecastChart();
    
    document.getElementById('scenario-form').addEventListener('submit', runScenarioSimulation);
}

function runScenarioSimulation(e) {
    e.preventDefault();
    const fertRate = parseInt(document.getElementById('fert-rate').value, 10);
    const irrigationLevel = parseInt(document.getElementById('irrigation-level').value, 10);
    
    // Simple simulation logic: Higher rate and higher irrigation = higher yield, but diminishing returns
    let baseYield = 7.0;
    let baseCost = 0.5; // cost factor
    
    let yieldMod = (fertRate - 150) / 100 * 0.4 + (irrigationLevel - 70) / 100 * 0.3;
    let newYield = Math.max(6.5, baseYield + yieldMod).toFixed(2);
    
    let costMod = (fertRate / 150) * 0.2 + (irrigationLevel / 70) * 0.1;
    let newCost = (baseCost + costMod).toFixed(2);
    
    alert(`Simulation Run: \nYield: ${newYield} tons/ha \nNew Cost Factor: ${newCost}`);
    
    // Re-render chart with new simulated data
    renderScenarioChart(newYield); 
}

function renderScenarioChart(simulatedYield = '7.8') {
    if (scenarioChartInstance) scenarioChartInstance.destroy();

    const scenarioCtx = document.getElementById('scenario-planner-chart').getContext('2d');
    
    scenarioChartInstance = new Chart(scenarioCtx, {
        type: 'bar',
        data: {
            labels: ['Baseline (150kg/ha, 70% Irr)', `Simulated (${document.getElementById('fert-rate').value}kg/ha, ${document.getElementById('irrigation-level').value}% Irr)`],
            datasets: [
                {
                    label: 'Projected Yield (Tons/Ha)',
                    data: [7.8, simulatedYield],
                    backgroundColor: ['#10B981', '#3B82F6'],
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Yield (Tons/Ha)' },
                    min: 5
                }
            }
        }
    });
}

function renderPrecipitationForecastChart() {
    const precipCtx = document.getElementById('precipitation-forecast-chart').getContext('2d');
    if (precipitationForecastChartInstance) precipitationForecastChartInstance.destroy();
    
    precipitationForecastChartInstance = new Chart(precipCtx, {
        type: 'line',
        data: {
            labels: ['Today', 'Day +1', 'Day +2', 'Day +3', 'Day +4', 'Day +5', 'Day +6'],
            datasets: [
                {
                    label: 'Rainfall Forecast (mm)',
                    data: [1, 0, 5, 20, 0, 0, 3],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Temperature (°C)',
                    data: [25, 28, 24, 22, 27, 29, 26],
                    borderColor: '#F59E0B',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Rainfall (mm)' },
                    max: 30
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Temperature (°C)' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}


// --- REAL-TIME DOCTOR / CHAT LOGIC ---

function toggleChatModal(show) {
    // This function remains a placeholder as the real-time doctor is a standard page
}

function handleChatSubmit(e) {
    e.preventDefault();
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');
    const userMessage = chatInput.value.trim();

    if (!userMessage) return;

    // 1. Append user message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble self-end ml-auto';
    userBubble.textContent = userMessage;
    chatWindow.appendChild(userBubble);
    chatInput.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // 2. Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator agripulse-bubble flex items-center';
    typingIndicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatWindow.appendChild(typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // 3. Simulate API response
    setTimeout(() => {
        // Remove typing indicator
        chatWindow.removeChild(typingIndicator);

        // Determine AI response based on keywords (simple simulation)
        let aiResponse = "I'm sorry, I could not find a specific answer for that. Please try rephrasing your question or refer to the knowledge base.";
        
        if (userMessage.toLowerCase().includes('symptom') || userMessage.toLowerCase().includes('sick') || userMessage.toLowerCase().includes('yellow') || userMessage.toLowerCase().includes('blight')) {
            aiResponse = "Based on your description, the symptoms of yellowing leaves with necrotic spots suggest **Maize Leaf Blight**, a fungal infection. I recommend immediate application of a broad-spectrum fungicide like **Azoxystrobin** to prevent further spread. Please also check your soil moisture levels as stress can worsen the condition.";
        } else if (userMessage.toLowerCase().includes('urea') || userMessage.toLowerCase().includes('fertilizer')) {
             aiResponse = "Urea (46-0-0) is essential for nitrogen supply in the vegetative growth stage of maize. For your current operation, the optimal top dressing rate is **150-200 kg/ha**. Based on your inventory, you should order at least 10 bags immediately to avoid delays in your schedule.";
        } else if (userMessage.toLowerCase().includes('weather') || userMessage.toLowerCase().includes('rain')) {
             aiResponse = "The latest 7-day forecast shows a dry period ahead, with a chance of light rain on Day +2. Your current field is showing low soil moisture (26%). **I recommend increasing your irrigation schedule by 20%** over the next 4 days to maintain optimal growing conditions.";
        }
        
        // Append AI response
        const aiBubble = document.createElement('div');
        aiBubble.className = 'chat-bubble agripulse-bubble self-start mr-auto';
        aiBubble.textContent = aiResponse;
        chatWindow.appendChild(aiBubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;

    }, 2000); 
}

// --- INITIALIZATION ---

window.addEventListener('DOMContentLoaded', () => {
    
    // Initial App State & Content
    initializeAppState();
    
    // --- Authentication Listeners ---
    document.getElementById('toggle-auth-mode').addEventListener('click', function() {
        const modeInput = document.getElementById('auth-mode');
        const authTitle = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const nameField = document.getElementById('name-field');

        if (modeInput.value === 'login') {
            modeInput.value = 'register';
            authTitle.textContent = 'Create a new account';
            submitBtn.textContent = 'Sign Up';
            nameField.classList.remove('hidden');
            this.textContent = 'Already have an account? Sign In';
        } else {
            modeInput.value = 'login';
            authTitle.textContent = 'Sign In to your account';
            submitBtn.textContent = 'Sign In';
            nameField.classList.add('hidden');
            this.textContent = "Don't have an account? Sign Up";
        }
    });

    document.getElementById('auth-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const mode = document.getElementById('auth-mode').value;
        const email = document.getElementById('email-address').value;
        const name = document.getElementById('full-name').value || 'New User'; // Use a default if not filled
        
        // Simple client-side simulation of login/signup
        if (mode === 'login' && email === 'john@agrifarm.com') {
             updateAuthState(true, 'John Farmer', email);
        } else if (mode === 'register') {
             updateAuthState(true, name, email);
        } else {
            alert('Sign In Failed. Please use john@agrifarm.com to sign in or use the Sign Up option.');
        }
    });
    
    // --- Global App Listeners ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        updateAuthState(false);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const pageId = e.currentTarget.getAttribute('data-page');
            switchPage(pageId);
        });
    });

    document.getElementById('context-selector').addEventListener('change', (e) => {
        switchContext(e.target.value);
    });
    
    document.getElementById('theme-selector').addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    document.getElementById('default-field').addEventListener('change', (e) => {
        currentFieldId = e.target.value;
        saveFields();
        alert('Default field updated! Dashboard will load this field on next login.');
    });

    // --- Mobile Sidebar Listeners ---
    document.getElementById('mobile-menu-btn').addEventListener('click', () => toggleSidebar(true));
    document.getElementById('sidebar-overlay').addEventListener('click', () => toggleSidebar(false));


    // --- Marketplace Listeners ---
    document.getElementById('open-post-listing-modal-btn').addEventListener('click', () => {
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
    document.getElementById('close-contact-modal').addEventListener('click', () => {
        document.getElementById('contact-modal').classList.add('hidden');
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

    // --- Crop Doctor / Upload Listeners ---
    setupCropDoctorListeners();

    // --- Real-time Doctor Chat Listener ---
    document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
});