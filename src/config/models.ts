// GLB Model Configuration
// Each entry defines a 3D building model and its placement on the terrain.

export interface ModelConfig {
    id: string;
    name: string;
    category: string;
    description: string;
    url: string;
    longitude: number;
    latitude: number;
    height: number;
    heading: number;
    localOffset: { x: number; y: number; z: number };
}

// Base URL for GLB assets served by Express (development) or LiteSpeed (production)
export const MODEL_BASE_URL = "http://localhost:8080";

export const MODELS: ModelConfig[] = [
    { id: '1', name: 'Building A', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/1.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
    { id: '2', name: 'Building B', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/2.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
    { id: '3', name: 'Building C', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/3.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
    { id: '4', name: 'Building D', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/4.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 182.3, z: 161.62 } },
    { id: '5', name: 'Building E', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/5.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 182.3, z: 161.62 } },
    { id: '6', name: 'Building F', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/6.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
    { id: '7', name: 'Building G', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/7.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 182.3, z: 161.62 } },
    { id: '8', name: 'Building H', category: 'Hunian', description: 'Hunian warga darungan', url: '/data/assets/glb/lod1/8.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: 32, y: 180.3, z: 161.62 } },
    { id: '9', name: 'Kantor Kelurahan', category: 'Hunian', description: 'Kawasan Kantor Kelurahan Darungan', url: '/data/assets/glb/lod2/kantor_kelurahan.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: -169, y: 244, z: 161.62 } },
    { id: '10', name: 'RTP Darungan', category: 'Hunian', description: 'Kawasan RTP Darungan', url: '/data/assets/glb/lod2/rtp_darungan.glb', longitude: 112.1748527, latitude: -8.1594355, height: 0, heading: 90, localOffset: { x: -146.5, y: 243.5, z: 161.62 } },
];

// ============================================================
// CCTV Billboard Configuration
// Each entry becomes a floating camera icon above the building.
// ============================================================
export interface CctvConfig {
    id: string;
    label: string;
    longitude: number;
    latitude: number;
    height: number;           // Height above sea level (meters)
    youtubeVideoId: string;   // YouTube video ID for simulation stream
}

export const CCTV_POINTS: CctvConfig[] = [
    {
        id: 'cctv-9',
        label: 'CCTV - Kantor Kelurahan',
        longitude: 112.1760945,
        latitude: -8.1595176,
        height: 178,   // ~5-8m above terrain
        youtubeVideoId: 'Vh1kB3g1iKM',  // Placeholder: traffic cam simulation video
    },
    {
        id: 'cctv-10',
        label: 'CCTV - RTP Darungan',
        longitude: 112.1752153,
        latitude: -8.1661888,
        height: 168,  // Slightly different height so billboards don't overlap
        youtubeVideoId: 'wKBnkkUzC7Y',  // Same placeholder for pilot
    },
];

// ============================================================
// Electricity / IoT Billboard Configuration
// ============================================================
export interface ElectricityPointConfig {
    id: string;
    label: string;
    buildingName: string;
    longitude: number;
    latitude: number;
    height: number;
    // Static simulated sensor data
    voltageV: number;
    currentA: number;
    powerKw: number;
    status: 'normal' | 'warning' | 'critical';
    dailyUsage: { hour: string; kwh: number }[]; // 24-hour profile
}

export const ELECTRICITY_POINTS: ElectricityPointConfig[] = [
    {
        id: 'elec-9',
        label: '⚡ Kantor Kelurahan',
        buildingName: 'Kantor Kelurahan Darungan',
        longitude: 112.17597152,
        latitude: -8.15948702,
        height: 178,
        voltageV: 220,
        currentA: 14.5,
        powerKw: 3.19,
        status: 'normal',
        dailyUsage: [
            { hour: '00:00', kwh: 0.4 }, { hour: '02:00', kwh: 0.3 },
            { hour: '04:00', kwh: 0.2 }, { hour: '06:00', kwh: 1.2 },
            { hour: '08:00', kwh: 3.8 }, { hour: '10:00', kwh: 4.2 },
            { hour: '12:00', kwh: 4.5 }, { hour: '14:00', kwh: 4.1 },
            { hour: '16:00', kwh: 3.9 }, { hour: '18:00', kwh: 5.2 },
            { hour: '20:00', kwh: 4.8 }, { hour: '22:00', kwh: 2.1 },
        ],
    },
    {
        id: 'elec-10',
        label: '⚡ RTP Darungan',
        buildingName: 'RTP Darungan',
        longitude: 112.1753000,
        latitude: -8.1663000,
        height: 165,
        voltageV: 218,
        currentA: 22.7,
        powerKw: 4.95,
        status: 'warning',  // Simulated anomaly
        dailyUsage: [
            { hour: '00:00', kwh: 0.8 }, { hour: '02:00', kwh: 0.6 },
            { hour: '04:00', kwh: 0.5 }, { hour: '06:00', kwh: 2.1 },
            { hour: '08:00', kwh: 5.1 }, { hour: '10:00', kwh: 6.3 },
            { hour: '12:00', kwh: 7.8 }, { hour: '14:00', kwh: 8.2 },
            { hour: '16:00', kwh: 7.5 }, { hour: '18:00', kwh: 9.1 },
            { hour: '20:00', kwh: 8.4 }, { hour: '22:00', kwh: 4.3 },
        ],
    },
];


