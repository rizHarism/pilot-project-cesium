// Cesium Configuration
// IMPORTANT: Keep Ion token secure, do not commit to public repository

const CONFIG = {
    // Cesium Ion Configuration
    ion: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YWQzYmZmYy03OWFhLTRmZmQtODU1Yy1jODcxNTEyMmM4NzUiLCJpZCI6Mzc3NTQ3LCJpYXQiOjE3NjgyMDM0NjZ9.txh6yWRnimd_1tATd6dY_8sh9eWWBUqpr7K4HHKO-yg',
        terrainAssetId: 4401208,  // DSM Terrain
        terrain2AssetId: 4445908,  // DTM Terrain
        pointCloudAssetId: 4401043 // LiDAR Point Cloud
    },

    // Data Paths
    data: {
        terrainUrl: 'http://localhost:8080/data/terrain/darungan/', // Path to your folder containing layer.json
        orthophotoTilesUrl: '/data/imagery5/{z}/{x}/{y}.png',  // XYZ tiles pattern
        // Note: Use {y} for standard XYZ tiles, {reverseY} for TMS format
        models: [
            { id: '1', name: 'Building A', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/1.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
            { id: '2', name: 'Building B', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/2.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
            { id: '3', name: 'Building C', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/3.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
            { id: '4', name: 'Building D', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/4.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 182.3, z: 161.62 } },
            { id: '5', name: 'Building E', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/5.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 182.3, z: 161.62 } },
            { id: '6', name: 'Building F', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/6.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
            { id: '7', name: 'Building G', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/7.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 182.3, z: 161.62 } },
            { id: '8', name: 'Building H', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/8.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
            { id: '9', name: 'Building H', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod2/kantor_kelurahan.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: -169, y: 244, z: 161.62 } },
            { id: '10', name: 'Building H', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod2/rtp_darungan.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: -146.5, y: 243.5, z: 161.62 } }
        ]
    },

    // Camera Initial Position (will be auto-calculated from terrain bounds)
    camera: {
        // These will be set automatically, or override manually if needed
        longitude: null,  // Will auto-detect from data
        latitude: null,   // Will auto-detect from data
        height: 300,     // Camera height in meters
        heading: 0,       // North
        pitch: -45,       // Looking down at 45 degrees
        roll: 0
    },

    // Viewer Options
    viewer: {
        animation: false,           // Hide animation widget (cleaner for presentation)
        baseLayerPicker: false,     // We provide our own layers
        fullscreenButton: true,     // Allow fullscreen
        geocoder: false,            // Hide search (not needed for local area)
        homeButton: true,           // Show home button
        infoBox: true,              // Show info box when clicking
        sceneModePicker: true,      // Allow 2D/3D toggle
        selectionIndicator: false,  // Hide selection indicator
        timeline: false,            // Hide timeline
        navigationHelpButton: true, // Show navigation help
        navigationInstructionsInitiallyVisible: false,
        shouldAnimate: false
    },

    // Presentation Settings
    presentation: {
        projectTitle: 'Digital Twin Pilot Project',
        projectSubtitle: 'Visualisasi 3D Kawasan dengan Orthophoto & DSM',
        showWelcomePanel: true
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
