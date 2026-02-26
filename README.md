# 🌏 Digital Twin Kawasan Darungan

A high-performance 3D Geospatial Visualization and Digital Twin platform built with **Next.js** and **CesiumJS**. This project visualizes the Darungan area with precision terrain (DTM), high-resolution orthophoto imagery, and interactive IoT simulations.

## 🚀 Key Features

- **Responsive 3D UI**: Fluid layout that adapts to Mobile (Bottom Drawer), Tablet, and Desktop (Floating Panels).
- **Interactive IoT Dashboards**: 
  - **⚡ Electricity Monitoring**: Real-time consumption simulation with dynamic charts (24h profiles).
  - **📷 CCTV Integration**: Interactive billboards with live YouTube simulation feeds.
- **Geospatial Simulations**: 
  - **🌊 Flood Simulation**: Interactive water level slider affecting the 3D terrain.
  - **Layer Controls**: Toggle Orthophoto opacity, DTM ground, and 3D GLB Models.
- **Performance Optimized**: 
  - Uses `next/dynamic` for client-side only Cesium rendering.
  - Gzip-compressed terrain serving via optimized Nginx Proxy.
  - SSR-optimized build pipeline.

## 🛠 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) (App Router)
- **3D Engine**: [CesiumJS](https://cesium.com/platform/cesiumjs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) (Modern Glassmorphism Design)
- **Infrastructure**: OpenLiteSpeed + Nginx Proxy (Port 8085) for heavy geospatial data.

## 📁 Infrastructure & Production Serving

Due to the specific compression requirements of Cesium `.terrain` files, the production environment uses a **Hybrid Server Architecture**:

1.  **OpenLiteSpeed (OLS)**: Serves the Next.js application on Ports 80/443.
2.  **Nginx Proxy (Port 8085)**: Dedicated to serving `/data/terrain/`.
    *   **Why?** Nginx handles the `Content-Encoding: gzip` header precisely for `.terrain` files while keeping `layer.json` as plain JSON, preventing decompression errors in the browser.

### Nginx Logic (Simplified):
- `.terrain` -> `Content-Encoding: gzip`
- `.json`    -> `Content-Type: application/json` (No Gzip)
- All       -> `Access-Control-Allow-Origin: *`

## 🏁 Getting Started

### Local Development
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Start the local data server (for terrain/imagery): `node serve_terrain.js`.
4. Start the Next.js dev server: `npm run dev`.
5. Open `http://localhost:3000`.

### Environment Variables
Setup a `.env.local` file with:
```bash
NEXT_PUBLIC_DATA_BASE_URL=http://localhost:8080
NEXT_PUBLIC_TERRAIN_URL=http://localhost:8080/data/terrain/darungan/
NEXT_PUBLIC_IMAGERY_URL=http://localhost:8080/data/imagery5/{z}/{x}/{y}.png
```

## 📈 Roadmap (Progress)

- [x] **Milestone 1**: Legacy Vanilla JS migration to Next.js.
- [x] **Milestone 2**: Local Terrain (DTM) & Orthophoto integration.
- [x] **Milestone 3**: Interactive 3D GLB Model placement.
- [x] **Milestone 4**: IoT Billboard Simulations (CCTV & Electricity).
- [x] **Milestone 5**: Responsive Layout & Production Infrastructure.
- [ ] **Milestone 6**: Relational Database for Dynamic Object Management (Prisma + PostgreSQL).

---
Developed with 💙 for Digital Twin Kawasan Darungan.

