// Main Cesium Viewer Application
// Digital Twin Pilot Project

// Set Cesium Ion access token
Cesium.Ion.defaultAccessToken = CONFIG.ion.accessToken;

// Global viewer reference
let viewer;
let orthophotoLayer;
let dtmProvider;
let pointCloudTileset;
let loadedModels = [];
let floodEntity;
let riverDataSource;
let waterHeight = 160.0;

/**
 * Initialize Cesium Viewer
 */
async function initializeViewer() {
    try {
        // Create Cesium Viewer
        viewer = new Cesium.Viewer('cesiumContainer', {
            ...CONFIG.viewer,
            // Use local terrain provider
            terrainProvider: await Cesium.CesiumTerrainProvider.fromUrl(CONFIG.data.terrainUrl, {
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
        await loadModels();
        
        // Setup water simulation layer
        setupWaterSimulation();
        
        // Load static river from GeoJSON
        // await loadRiverGeoJson();

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
        console.log('Loading local terrain from folder...');
        
        // Load local terrain
        dtmProvider = await Cesium.CesiumTerrainProvider.fromUrl(
            CONFIG.data.terrainUrl,
            {
                requestVertexNormals: true,
                requestWaterMask: false
            }
        );

        // Set default terrain (Local DTM)
        viewer.terrainProvider = dtmProvider;
        
        console.log('✅ Local Terrain loaded successfully');
        updateStatus('DTM Terrain loaded');
        
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
            minimumLevel: 18,  // FIXED: was swapped!
            maximumLevel: 22,  // FIXED: was swapped!
            
            // CRITICAL: Add proper tiling scheme to prevent cache enumeration error
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            // tilingScheme: new Cesium.GeographicTilingScheme(), 

            rectangle: Cesium.Rectangle.fromDegrees(
                112.172618282,
                -8.167123097,
                112.179076059,
                -8.158026721
            ),
            
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
        const offset = new Cesium.Cartesian3(0, 0, 0); 
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
 * Load Multiple GLB Models from Config
 */
async function loadModels() {
    try {
        console.log('Loading GLB models from config...');
        
        // Remove existing models if any
        loadedModels.forEach(m => viewer.scene.primitives.remove(m));
        loadedModels = [];

        for (const modelConfig of CONFIG.data.models) {
            const position = Cesium.Cartesian3.fromDegrees(
                modelConfig.longitude,
                modelConfig.latitude,
                modelConfig.height || 0
            );

            // 1. Create global transformation matrix (Translation to GPS)
            const worldMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);

            // 2. Create rotation matrix from Heading, Pitch, Roll
            const heading = Cesium.Math.toRadians(modelConfig.heading || 90);
            const pitch = 0;
            const roll = 0;
            const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
            const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
                Cesium.Matrix3.fromQuaternion(Cesium.Quaternion.fromHeadingPitchRoll(hpr))
            );

            // 3. Create local offset matrix
            const offset = modelConfig.localOffset || { x: 0, y: 0, z: 0 };
            const offsetMatrix = Cesium.Matrix4.fromTranslation(
                new Cesium.Cartesian3(offset.x, offset.y, offset.z)
            );

            // 4. Compose: World * Rotation * Offset
            const modelMatrix = new Cesium.Matrix4();
            Cesium.Matrix4.multiply(worldMatrix, rotationMatrix, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, offsetMatrix, modelMatrix);

            const model = await Cesium.Model.fromGltfAsync({
                url: modelConfig.url,
                modelMatrix: modelMatrix,
                scale: 1,
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
            });

            // ATTACH METADATA
            // We use the 'id' property which Cesium uses for picking
            model.id = modelConfig; 

            viewer.scene.primitives.add(model);
            loadedModels.push(model);
        }

        // --- ADD INTERACTIVITY HANDLERS ---
        setupModelInteractivity();
        
        console.log(`✅ Loaded ${loadedModels.length} GLB models successfully`);
        updateStatus(`${loadedModels.length} Models loaded with Interactivity`);
        
    } catch (error) {
        console.error('❌ Error loading models:', error);
        showError('Failed to load models: ' + error.message);
    }
}

/**
 * Setup Hover and Click Interactivity for Models
 */
function setupModelInteractivity() {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let lastHoveredModel = null;

    // 1. HOVER EFFECT (Color Change)
    handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        
        // Reset previous model color
        if (lastHoveredModel) {
            lastHoveredModel.color = Cesium.Color.WHITE;
            lastHoveredModel = null;
        }

        if (Cesium.defined(pickedObject) && pickedObject.primitive instanceof Cesium.Model) {
            const model = pickedObject.primitive;
            lastHoveredModel = model;

            // Change color to Green on hover
            // model.color = Cesium.Color.LIME; // Or Cesium.Color.ORANGE
            model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT;
            
            // Show shortcut in status bar
            if (model.id && model.id.name) {
                updateStatus(`Hover: ${model.id.name} (${model.id.category})`);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 2. CLICK EFFECT (Show Popup)
    handler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position);
        
        if (Cesium.defined(pickedObject) && pickedObject.primitive instanceof Cesium.Model) {
            const model = pickedObject.primitive;
            const data = model.id;

            if (data) {
                // Show Cesium InfoBox (default popup)
                viewer.selectedEntity = new Cesium.Entity({
                    name: data.name,
                    description: `
                        <div style="padding: 10px; font-family: sans-serif;">
                            <p><strong>Kategori:</strong> ${data.category}</p>
                            <p><strong>Deskripsi:</strong> ${data.description}</p>
                            <hr/>
                            <p style="font-size: 0.8em; color: #666;">ID: ${data.id}</p>
                        </div>
                    `
                });
                
                // Highlight color on click (Orange)
                model.color = Cesium.Color.ORANGE;
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * Setup Camera Position
 */
function setupCamera(timeOut = 0) {
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
                    112.17619, -8.16051, 300
                ),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: Cesium.Math.toRadians(0)
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
    const dtmToggle = document.getElementById('toggleDTM');
    const pointCloudToggle = document.getElementById('togglePointCloud');
    const objectsToggle = document.getElementById('toggle3DObjects');
    const waterSlider = document.getElementById('waterLevelSlider');
    const waterValueLabel = document.getElementById('waterLevelValue');

    if (orthophotoToggle) {
        orthophotoToggle.addEventListener('change', (e) => {
            if (orthophotoLayer) {
                orthophotoLayer.show = e.target.checked;
            }
        });
    }

    if (dtmToggle) {
        dtmToggle.addEventListener('change', (e) => {
            if (dtmToggle.checked) {
                viewer.terrainProvider = dtmProvider;
                updateStatus('DTM (Ground) active');
            } else {
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

    if (objectsToggle) {
        objectsToggle.addEventListener('change', (e) => {
            loadedModels.forEach(model => {
                model.show = e.target.checked;
            });
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

    if (waterSlider) {
        waterSlider.addEventListener('input', (e) => {
            const level = parseFloat(e.target.value);
            waterHeight = level;
            if (waterValueLabel) {
                waterValueLabel.textContent = level + 'm';
            }
            updateStatus(`Flood level: ${level}m`);
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

    // --- COORDINATE PICKER (DEBUG TOOL) ---
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
        const ray = viewer.camera.getPickRay(click.position);
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        
        if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;

            console.log('📍 Clicked Coordinate:');
            console.log(`Longitude: ${longitude.toFixed(7)}`);
            console.log(`Latitude: ${latitude.toFixed(7)}`);
            console.log(`Height: ${height.toFixed(2)}`);
            
            updateStatus(`Coord: ${longitude.toFixed(5)}, ${latitude.toFixed(5)} (Logged to Console)`);
            
            // Auto-copy to clipboard (optional but handy)
            const coordStr = `${longitude.toFixed(7)}, ${latitude.toFixed(7)}`;
            navigator.clipboard.writeText(coordStr).then(() => {
                console.log('Copy to clipboard: ' + coordStr);
            });
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // --- END DEBUG TOOL ---
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
        }, 100);
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

/**
 * Setup Water/Flood Simulation Layer (Affected Area)
 */
function setupWaterSimulation() {
    // Definisi area poligon air yang lebih luas (Area Terdampak)
    // Berdasarkan request: 500m Utara, 300m Selatan dari area sungai
    const rectangle = Cesium.Rectangle.fromDegrees(
        112.1725, // West
        -8.1670,  // South (~50m south of river)
        112.1790, // East
        -8.1646   // North (~100m north of river)
    );

    floodEntity = viewer.entities.add({
        name: 'Flood Simulation',
        rectangle: {
            coordinates: new Cesium.CallbackProperty(() => {
                return rectangle;
            }, false),
            extrudedHeight: new Cesium.CallbackProperty(() => {
                return waterHeight;
            }, false),
            height: new Cesium.CallbackProperty(() => {
                return waterHeight - 100; 
            }, false),
            material: Cesium.Color.fromCssColorString('#006994').withAlpha(0.5),
            show: true
        }
    });

    console.log('🌊 Dynamic flood layer (Affected Area) initialized');
}

/**
 * Load Static River from GeoJSON
 */
// async function loadRiverGeoJson() {
//     try {
//         console.log('Loading river GeoJSON...');
        
//         riverDataSource = await Cesium.GeoJsonDataSource.load('/data/assets/river/sample_river.geojson', {
//             fill: Cesium.Color.fromCssColorString('#006994').withAlpha(0.8),
//             stroke: Cesium.Color.fromCssColorString('#006994').withAlpha(0.8),
//             strokeWidth: 1
//         });

//         viewer.dataSources.add(riverDataSource);

//         // Adjust height for all river entities (static water at 186.5m)
//         const entities = riverDataSource.entities.values;
//         for (let i = 0; i < entities.length; i++) {
//             const entity = entities[i];
//             if (entity.polygon) {
//                 entity.polygon.height = 159.5; // Base of water
//                 entity.polygon.extrudedHeight = 160.3; // Surface of water
//                 entity.polygon.material = Cesium.Color.fromCssColorString('#006994').withAlpha(0.8);
//             }
//         }

//         console.log('✅ River GeoJSON loaded');
//     } catch (error) {
//         console.error('❌ Error loading river GeoJSON:', error);
//     }
// }

// Make available globally for debugging
window.getCurrentCameraPosition = getCurrentCameraPosition;
window.viewer = null;  // Will be set after initialization

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeViewer);
} else {
    initializeViewer();
}
