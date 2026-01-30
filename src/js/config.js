// Cesium Configuration
// IMPORTANT: Keep Ion token secure, do not commit to public repository

const CONFIG = {
    // Cesium Ion Configuration
    ion: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YWQzYmZmYy03OWFhLTRmZmQtODU1Yy1jODcxNTEyMmM4NzUiLCJpZCI6Mzc3NTQ3LCJpYXQiOjE3NjgyMDM0NjZ9.txh6yWRnimd_1tATd6dY_8sh9eWWBUqpr7K4HHKO-yg',
        terrainAssetId: 4401208,  // DSM Terrain
        terrain2AssetId: 4401233,  // DTM Terrain
        pointCloudAssetId: 4401043 // LiDAR Point Cloud
    },

    // Data Paths
    data: {
        orthophotoTilesUrl: '/../data/imagery3/{z}/{x}/{y}.png',  // XYZ tiles pattern
        // Note: Use {y} for standard XYZ tiles, {reverseY} for TMS format
    },

    // Camera Initial Position (will be auto-calculated from terrain bounds)
    camera: {
        // These will be set automatically, or override manually if needed
        longitude: null,  // Will auto-detect from data
        latitude: null,   // Will auto-detect from data
        height: 1000,     // Camera height in meters
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
