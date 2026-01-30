// Main Cesium Viewer Application
// Digital Twin Pilot Project

// Set Cesium Ion access token
Cesium.Ion.defaultAccessToken = CONFIG.ion.accessToken;

// Global viewer reference
let viewer;
let orthophotoLayer;
let dsmProvider;
let dtmProvider;
let pointCloudTileset;

/**
 * Initialize Cesium Viewer
 */
async function initializeViewer() {
    try {
        // Create Cesium Viewer
        viewer = new Cesium.Viewer('cesiumContainer', {
            ...CONFIG.viewer,
            // Use default Cesium World Terrain initially, will replace with custom
            terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
                requestVertexNormals: true,
                requestWaterMask: false
            })
        });

        // Enable lighting
        viewer.scene.globe.enableLighting = false;  // False for better orthophoto visibility
        
        // Disable atmosphere for clearer view
        viewer.scene.skyAtmosphere.show = true;
        
        // Enable depth testing for better layer rendering
        viewer.scene.globe.depthTestAgainstTerrain = true;

        // Load custom terrain, imagery, and point cloud
        await loadTerrain();
        await loadOrthophoto();
        await loadPointCloud();

        // Setup camera and controls
        setupCamera();
        
        // Setup UI
        setupUI();

        // Show welcome panel
        if (CONFIG.presentation.showWelcomePanel) {
            showWelcomePanel();
        }

        console.log('✅ Cesium Viewer initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing viewer:', error);
        showError('Failed to initialize viewer: ' + error.message);
    }
}

/**
 * Load DSM & DTM Terrains from Cesium Ion
 */
async function loadTerrain() {
    try {
        console.log('Loading terrains from Cesium Ion...');
        
        // Load DSM
        dsmProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(
            CONFIG.ion.terrainAssetId,
            {
                requestVertexNormals: true,
                requestWaterMask: false
            }
        );

        // Load DTM
        dtmProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(
            CONFIG.ion.terrain2AssetId,
            {
                requestVertexNormals: true,
                requestWaterMask: false
            }
        );

        // Set default terrain (DSM)
        viewer.terrainProvider = dsmProvider;
        
        console.log('✅ Terrains loaded successfully');
        updateStatus('Terrains loaded');
        
    } catch (error) {
        console.error('❌ Error loading terrain:', error);
        showError('Failed to load terrain: ' + error.message);
    }
}

/**
 * Load Orthophoto Tiles from local directory
 */
async function loadOrthophoto() {
    try {
        console.log('Loading orthophoto tiles...');
        
        // Remove default base imagery
        // viewer.imageryLayers.removeAll();
        
        // Add custom orthophoto tiles with proper configuration
        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: CONFIG.data.orthophotoTilesUrl,
            minimumLevel: 14,  // FIXED: was swapped!
            maximumLevel: 18,  // FIXED: was swapped!
            
            // CRITICAL: Add proper tiling scheme to prevent cache enumeration error
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            
            // CRITICAL: Add rectanggle bound
            rectangle: Cesium.Rectangle.fromDegrees(
                112.1740177820000071,-8.1624661209999996, 112.1796697660000035,-8.1567505919999999
                // 117.4681939, 0.1704951, 117.4725830,   117.1749142 0.1749142   // data bontang
            ),
            
            hasAlphaChannel: true,

            // Handle tile loading gracefully
            hasAlphaChannel: true,
            
            // Credit
            credit: 'Orthophoto © ARUNIKA'
        });

        orthophotoLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);

        // Set brightness/contrast if needed
        orthophotoLayer.brightness = 1.0;
        orthophotoLayer.contrast = 1.0;
        orthophotoLayer.alpha = 1.0;

        console.log('✅ Orthophoto loaded successfully');
        updateStatus('Orthophoto loaded');
        
    } catch (error) {
        console.error('❌ Error loading orthophoto:', error);
        showError('Failed to load orthophoto: ' + error.message);
    }
}

/**
 * Load LiDAR Point Cloud from Cesium Ion
 */
async function loadPointCloud() {
    try {
        console.log('Loading point cloud from Cesium Ion...');
        
        pointCloudTileset = await Cesium.Cesium3DTileset.fromIonAssetId(
            CONFIG.ion.pointCloudAssetId
        );

        viewer.scene.primitives.add(pointCloudTileset);
        
        // Optional: Apply basic styling
        pointCloudTileset.style = new Cesium.Cesium3DTileStyle({
            pointSize: 3
        });

        // 1. Ambil posisi pusat tileset
        const surfacePosition = pointCloudTileset.boundingSphere.center;
        // 2. Tentukan offset lokal (misal: naik 35 meter)
        const offset = new Cesium.Cartesian3(0, 0, 26.0); 
        // 3. Hitung matrix transformasi
        const translationMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(surfacePosition);
        const localTranslation = Cesium.Matrix4.fromTranslation(offset);
        // 4. Aplikasikan translasi lokal ke global
        const finalMatrix = Cesium.Matrix4.multiply(translationMatrix, localTranslation, new Cesium.Matrix4());
        const inverseTranslation = Cesium.Matrix4.inverse(translationMatrix, new Cesium.Matrix4());
        
        pointCloudTileset.modelMatrix = Cesium.Matrix4.multiply(finalMatrix, inverseTranslation, new Cesium.Matrix4());
        // --- AKHIR KODE BARU ---

        console.log('✅ Point cloud loaded successfully');
        updateStatus('Point cloud loaded');
        
    } catch (error) {
        console.error('❌ Error loading point cloud:', error);
        showError('Failed to load point cloud: ' + error.message);
    }
}

/**
 * Setup Camera Position
 */
function setupCamera(timeOut = 5000) {
    console.log(timeOut);
    // Wait for terrain and imagery to load
    setTimeout(() => {
        // Use Cesium's built-in home button functionality
        // or fly to a reasonable view of the data
        
        // Option 1: Let user use home button (viewer will auto-calculate extent)
        // This is the safest approach
        
        // Option 2: If you know your area bounds, specify them:
        if (CONFIG.camera.longitude && CONFIG.camera.latitude) {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    CONFIG.camera.longitude,
                    CONFIG.camera.latitude,
                    CONFIG.camera.height || 1000
                ),
                orientation: {
                    heading: Cesium.Math.toRadians(CONFIG.camera.heading || 0),
                    pitch: Cesium.Math.toRadians(CONFIG.camera.pitch || -45),
                    roll: Cesium.Math.toRadians(CONFIG.camera.roll || 0)
                },
                duration: 2
            });
        } else {
            // Use terrain asset to get approximate center
            // Fly to a good initial altitude to see the terrain
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    112.177070,  // Approximate Indonesia coordinates
                    -8.167807,   // Adjust based on your area
                    1000 // Start higher to see more area
                ),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0
                },
                duration: 2
            });
        }

        updateStatus('Ready for presentation');
    }, timeOut);  // Wait 3 seconds for data to load
}

/**
 * Setup UI Controls and Event Handlers
 */
function setupUI() {
    // Layer visibility toggles
    const orthophotoToggle = document.getElementById('toggleOrthophoto');
    const dsmToggle = document.getElementById('toggleDSM');
    const dtmToggle = document.getElementById('toggleDTM');
    const pointCloudToggle = document.getElementById('togglePointCloud');

    if (orthophotoToggle) {
        orthophotoToggle.addEventListener('change', (e) => {
            if (orthophotoLayer) {
                orthophotoLayer.show = e.target.checked;
            }
        });
    }

    if (dsmToggle && dtmToggle) {
        dsmToggle.addEventListener('change', () => {
            if (dsmToggle.checked) {
                dtmToggle.checked = false;
                viewer.terrainProvider = dsmProvider;
                updateStatus('DSM (Surface) active');
            } else if (!dtmToggle.checked) {
                viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                updateStatus('Terrain elevation disabled');
            }
        });

        dtmToggle.addEventListener('change', () => {
            if (dtmToggle.checked) {
                dsmToggle.checked = false;
                viewer.terrainProvider = dtmProvider;
                updateStatus('DTM (Ground) active');
            } else if (!dsmToggle.checked) {
                viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                updateStatus('Terrain elevation disabled');
            }
        });
    }

    if (pointCloudToggle) {
        pointCloudToggle.addEventListener('change', (e) => {
            if (pointCloudTileset) {
                pointCloudTileset.show = e.target.checked;
            }
        });
    }

    // Opacity slider
    const opacitySlider = document.getElementById('orthophotoOpacity');
    const opacityValue = document.getElementById('opacityValue');
    
    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            orthophotoLayer.alpha = opacity;
            if (opacityValue) {
                opacityValue.textContent = Math.round(opacity * 100) + '%';
            }
        });
    }

    // Reset camera button
    const resetButton = document.getElementById('resetCamera');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            setupCamera(1);
        });
    }

    // Fullscreen toggle
    const fullscreenButton = document.getElementById('fullscreenToggle');
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            if (viewer.fullscreenButton.viewModel.command.canExecute) {
                viewer.fullscreenButton.viewModel.command();
            }
        });
    }
}

/**
 * Show Welcome Panel
 */
function showWelcomePanel() {
    const panel = document.getElementById('welcomePanel');
    if (panel) {
        panel.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            panel.style.opacity = '0';
            setTimeout(() => {
                panel.style.display = 'none';
            }, 500);
        }, 5000);
    }
}

/**
 * Update Status Message
 */
function updateStatus(message) {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = '#4CAF50';
    }
}

/**
 * Show Error Message
 */
function showError(message) {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = '⚠️ ' + message;
        statusElement.style.color = '#f44336';
    }
    
    // Also show in console
    console.error(message);
}

/**
 * Utility: Get current camera position (for debugging/setup)
 */
function getCurrentCameraPosition() {
    const camera = viewer.camera;
    const position = camera.positionCartographic;
    
    console.log('Current Camera Position:');
    console.log('Longitude:', Cesium.Math.toDegrees(position.longitude));
    console.log('Latitude:', Cesium.Math.toDegrees(position.latitude));
    console.log('Height:', position.height);
    console.log('Heading:', Cesium.Math.toDegrees(camera.heading));
    console.log('Pitch:', Cesium.Math.toDegrees(camera.pitch));
    console.log('Roll:', Cesium.Math.toDegrees(camera.roll));
}

// Make available globally for debugging
window.getCurrentCameraPosition = getCurrentCameraPosition;
window.viewer = null;  // Will be set after initialization

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeViewer);
} else {
    initializeViewer();
}
