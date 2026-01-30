# Digital Twin Pilot Project - Cesium Viewer

Visualisasi 3D kawasan menggunakan Cesium dengan orthophoto dan DSM terrain.

## 📋 Project Overview

Project ini adalah pilot project untuk digital twin visualization dengan data:
- **Orthophoto**: High resolution aerial imagery (XYZ tiles)
- **DSM**: Digital Surface Model dari photogrammetry (Cesium Ion)
- **Target**: Internal presentation & client showcase

## 🚀 Quick Start

### Prerequisites

- Node.js installed (v14 or higher)
- npm atau yarn package manager
- Modern web browser (Chrome, Edge, Firefox)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

   Atau jika belum ada npm, minimal install http-server global:
   ```bash
   npm install -g http-server
   ```

2. **Verify data structure:**
   ```
   Source Code Cesium Dummy/
   ├── data/
   │   └── imagery/        ← Orthophoto tiles harus ada di sini
   │       ├── 14/
   │       ├── 15/
   │       ├── 16/
   │       └── ...
   └── src/
       ├── index.html
       └── ...
   ```

### Running the Application

**Method 1: Using npm script (recommended)**
```bash
npm run dev
```
Browser akan otomatis buka ke `http://localhost:8080/src/index.html`

**Method 2: Manual http-server**
```bash
http-server . -p 8080 -c-1 --cors
```
Kemudian buka browser ke: `http://localhost:8080/src/index.html`

**Method 3: Python SimpleHTTPServer (alternative)**
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

## 🎯 Usage

### Navigation Controls
- **Left click + drag**: Rotate view
- **Right click + drag**: Pan camera
- **Scroll wheel**: Zoom in/out
- **Middle click + drag**: Tilt camera
- **Home button**: Reset to initial view

### Layer Controls
- Toggle orthophoto visibility
- Toggle terrain visibility  
- Adjust orthophoto opacity (0-100%)
- Reset camera to default position

### Fullscreen Mode
- Click "Toggle Fullscreen" button
- Or use Cesium's builtin fullscreen widget

## 📁 Project Structure

```
Source Code Cesium Dummy/
├── data/
│   ├── imagery/              # Orthophoto XYZ tiles
│   │   └── {z}/{x}/{y}.png
│   └── terrain/              # (Optional) Downloaded Ion terrain
│
├── src/
│   ├── index.html            # Main HTML file
│   ├── css/
│   │   └── main.css          # Styling
│   └── js/
│       ├── config.js         # Configuration (Ion token, asset IDs)
│       └── main.js           # Cesium viewer logic
│
├── package.json              # Dependencies
└── README.md                 # This file
```

## ⚙️ Configuration

Edit `src/js/config.js` untuk customize:

### Cesium Ion Settings
```javascript
ion: {
    accessToken: 'YOUR_ION_TOKEN',
    terrainAssetId: YOUR_ASSET_ID
}
```

### Camera Initial Position
```javascript
camera: {
    longitude: 106.xxx,  // Adjust to your area
    latitude: -6.xxx,    // Adjust to your area
    height: 2000,        // Meters above terrain
    pitch: -45           // Angle
}
```

### Tile URL Pattern
```javascript
data: {
    orthophotoTilesUrl: '../data/imagery/{z}/{x}/{reverseY}.png'
}
```

**Note**: 
- Use `{reverseY}` for XYZ tiles
- Use `{y}` for TMS tiles
- Adjust based on your tile generator output

## 🎨 Customization

### Change Project Title
Edit `src/js/config.js`:
```javascript
presentation: {
    projectTitle: 'Your Project Title',
    projectSubtitle: 'Your Subtitle'
}
```

### Disable Welcome Panel
```javascript
presentation: {
    showWelcomePanel: false
}
```

### Adjust Viewer Options
```javascript
viewer: {
    animation: false,
    timeline: false,
    // ... other Cesium viewer options
}
```

## 🔧 Troubleshooting

### Problem: Orthophoto tidak muncul

**Solutions:**
1. Verify tiles path di `config.js`
2. Check browser console untuk errors
3. Verify tiles ada di `data/imagery/{z}/{x}/{y}.png`
4. Try adjust URL pattern (`{y}` vs `{reverseY}`)
5. Check CORS - harus pakai http-server, bukan file://

### Problem: Terrain tidak load

**Solutions:**
1. Verify Ion access token valid
2. Check asset ID correct
3. Login ke ion.cesium.com - verify asset processed
4. Check browser console for Ion errors
5. Verify internet connection (Ion hosted)

### Problem: White borders di orthophoto

**Solutions:**
1. Re-export tiles as PNG (not JPEG)
2. Set transparency di QGIS
3. Use metatile option when generating
4. Check ortho source nodata handling

### Problem: Performance lambat

**Solutions:**
1. Reduce max zoom level di config
2. Check tile sizes (256x256 optimal)
3. Close other heavy browser tabs
4. Use Chrome/Edge (better WebGL performance)

## 🎯 Presentation Tips

### Before Presentation:
1. ✅ Test semua controls
2. ✅ Set camera ke view yang bagus (copy coords dengan `getCurrentCameraPosition()`)
3. ✅ Clear browser cache
4. ✅ Close unnecessary apps
5. ✅ Test internet connection (untuk Ion terrain)
6. ✅ Prepare fallback slides jika technical issue

### During Presentation:
1. Start dengan fullscreen mode
2. Gunakan smooth camera movements
3. Explain data sources (ortho, DSM)
4. Show layer toggles & opacity
5. Demonstrate 3D terrain elevation
6. Highlight detail areas

### Debug Commands (Browser Console):
```javascript
// Get current camera position
getCurrentCameraPosition()

// Access viewer object
viewer

// Check loaded imagery layers
viewer.imageryLayers.length

// Check terrain provider
viewer.terrainProvider
```

## 📊 Data Specifications

### Orthophoto
- **Format**: XYZ tiles (PNG or JPEG)
- **CRS**: Originally EPSG:32650 (UTM 50N)
- **Zoom levels**: 14-19
- **Tile size**: 256x256 pixels
- **Location**: `data/imagery/`

### DSM Terrain
- **Source**: Cesium Ion Asset #4396839
- **Format**: Quantized mesh (processed by Ion)
- **CRS**: Converted to WGS84 by Ion
- **Hosting**: Cesium Ion CDN

## 🔐 Security Notes

**IMPORTANT**: 
- ⚠️ `config.js` contains Ion access token
- ⚠️ Do NOT commit to public repository
- ⚠️ For production, use environment variables
- ⚠️ Consider using restricted Ion tokens

## 📝 Next Steps / Future Enhancements

### Planned Features:
- [ ] LiDAR point cloud integration (3D Tiles)
- [ ] Vision survey 3D models (glTF/glb)
- [ ] Measurement tools (distance, area, volume)
- [ ] Custom markers/annotations
- [ ] Before/after comparison slider
- [ ] Automated flythrough tour
- [ ] Screenshot/export functionality
- [ ] Multi-language support

### Data Processing:
- [ ] Process full 1200ha dataset
- [ ] Clip LiDAR to focus areas
- [ ] Georeference vision survey models
- [ ] Optimize large orthophoto (23GB → tiles)
- [ ] Generate LOD for point clouds

## 📞 Support

**Project Contact**: ARUNIKA  
**Cesium Documentation**: https://cesium.com/learn/  
**Cesium Forum**: https://community.cesium.com/

## 📄 License

Internal use - ARUNIKA  
Cesium: Apache License 2.0

---

**Last Updated**: 2026-01-29  
**Version**: 1.0.0  
**Status**: ✅ Ready for Presentation
