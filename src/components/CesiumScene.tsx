"use client";

import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { MODELS, MODEL_BASE_URL, ModelConfig, CCTV_POINTS, CctvConfig, ELECTRICITY_POINTS, ElectricityPointConfig } from "@/config/models";

interface CesiumSceneProps {
    terrainUrl: string;
    imageryUrl: string;
    showOrthophoto: boolean;
    orthophotoOpacity: number;
    showDTM: boolean;
    showModels: boolean;
    waterLevel: number;
    cameraResetTrigger: number;
    onCctvClick: (cctv: CctvConfig) => void;
    onElectricityClick: (elec: ElectricityPointConfig) => void;
}

export default function CesiumScene({
    terrainUrl,
    imageryUrl,
    showOrthophoto,
    orthophotoOpacity,
    showDTM,
    showModels,
    waterLevel,
    cameraResetTrigger,
    onCctvClick,
    onElectricityClick
}: CesiumSceneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Cesium.Viewer | null>(null);
    const isInitialized = useRef(false);

    // Store references to map elements
    const orthophotoLayerRef = useRef<Cesium.ImageryLayer | null>(null);
    const dtmProviderRef = useRef<Cesium.CesiumTerrainProvider | null>(null);
    const loadedModelsRef = useRef<Cesium.Model[]>([]);

    const [viewerReady, setViewerReady] = useState(false);

    // Initializer Effect (Runs only once)
    useEffect(() => {
        if (!containerRef.current || isInitialized.current) return;
        isInitialized.current = true;

        (window as any).CESIUM_BASE_URL = '/cesium/';

        const initializeViewer = async () => {
            dtmProviderRef.current = await Cesium.CesiumTerrainProvider.fromUrl(terrainUrl, {
                requestVertexNormals: true,
                requestWaterMask: false
            });

            const viewer = new Cesium.Viewer(containerRef.current!, {
                animation: false,
                baseLayerPicker: false,
                fullscreenButton: true,
                geocoder: false,
                homeButton: true,
                infoBox: true,
                sceneModePicker: true,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: true,
                navigationInstructionsInitiallyVisible: false,
                shouldAnimate: false,
                terrainProvider: dtmProviderRef.current,
            });

            viewer.scene.globe.enableLighting = false;
            if (viewer.scene.skyAtmosphere) {
                viewer.scene.skyAtmosphere.show = true;
            }
            viewer.scene.globe.depthTestAgainstTerrain = true;

            // Load Orthophoto
            const imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: imageryUrl,
                minimumLevel: 18,
                maximumLevel: 22,
                tilingScheme: new Cesium.WebMercatorTilingScheme(),
                rectangle: Cesium.Rectangle.fromDegrees(
                    112.172618282, -8.167123097, 112.179076059, -8.158026721
                ),
                hasAlphaChannel: true,
                credit: 'Orthophoto © ARUNIKA'
            });
            orthophotoLayerRef.current = viewer.imageryLayers.addImageryProvider(imageryProvider);

            // Setup Water / Flood Simulation
            const floodRect = Cesium.Rectangle.fromDegrees(112.1725, -8.1670, 112.1790, -8.1646);
            const waterState = { height: 161.0 };
            (viewer as any)._waterState = waterState;

            viewer.entities.add({
                name: 'Flood Simulation',
                rectangle: {
                    coordinates: new Cesium.CallbackProperty(() => floodRect, false),
                    extrudedHeight: new Cesium.CallbackProperty(() => (viewer as any)._waterState.height, false),
                    height: new Cesium.CallbackProperty(() => (viewer as any)._waterState.height - 100, false),
                    material: Cesium.Color.fromCssColorString('#006994').withAlpha(0.5)
                }
            });

            // =============================================
            // Load GLB Models
            // =============================================
            await loadModels(viewer);

            // =============================================
            // Add CCTV Billboards
            // =============================================
            setupCctvBillboards(viewer);

            // =============================================
            // Add Electricity Billboards
            // =============================================
            setupElectricityBillboards(viewer);

            // Setup Model Interactivity (Hover + Click)
            setupModelInteractivity(viewer);

            // Initial Camera
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(112.17619, -8.16051, 300),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: Cesium.Math.toRadians(0)
                },
                duration: 0
            });

            viewerRef.current = viewer;
            setViewerReady(true);
        };

        initializeViewer();

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
                isInitialized.current = false;
            }
        };
    }, [terrainUrl, imageryUrl]);

    // =============================================
    // Load GLB Models from Config
    // =============================================
    async function loadModels(viewer: Cesium.Viewer) {
        loadedModelsRef.current = [];

        for (const mc of MODELS) {
            try {
                const position = Cesium.Cartesian3.fromDegrees(mc.longitude, mc.latitude, mc.height || 0);

                // 1. Global transformation (GPS position)
                const worldMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);

                // 2. Rotation from Heading/Pitch/Roll
                const heading = Cesium.Math.toRadians(mc.heading || 90);
                const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
                const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
                    Cesium.Matrix3.fromQuaternion(Cesium.Quaternion.fromHeadingPitchRoll(hpr))
                );

                // 3. Local offset
                const offset = mc.localOffset || { x: 0, y: 0, z: 0 };
                const offsetMatrix = Cesium.Matrix4.fromTranslation(
                    new Cesium.Cartesian3(offset.x, offset.y, offset.z)
                );

                // 4. Compose: World * Rotation * Offset
                const modelMatrix = new Cesium.Matrix4();
                Cesium.Matrix4.multiply(worldMatrix, rotationMatrix, modelMatrix);
                Cesium.Matrix4.multiply(modelMatrix, offsetMatrix, modelMatrix);

                const model = await Cesium.Model.fromGltfAsync({
                    url: MODEL_BASE_URL + mc.url,
                    modelMatrix: modelMatrix,
                    scale: 1,
                });

                // Attach metadata for click/hover identification
                model.id = mc;

                viewer.scene.primitives.add(model);
                loadedModelsRef.current.push(model);
            } catch (err) {
                console.warn(`⚠️ Failed to load model ${mc.id} (${mc.name}):`, err);
            }
        }

        console.log(`✅ Loaded ${loadedModelsRef.current.length} GLB models`);
    }

    // =============================================
    // Hover + Click Interactivity
    // =============================================
    function setupModelInteractivity(viewer: Cesium.Viewer) {
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        let lastHoveredModel: Cesium.Model | null = null;

        // HOVER: highlight model on mouseover
        handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
            const pickedObject = viewer.scene.pick(movement.endPosition);

            // Reset previous
            if (lastHoveredModel) {
                lastHoveredModel.color = Cesium.Color.WHITE;
                lastHoveredModel = null;
            }

            if (Cesium.defined(pickedObject) && pickedObject.primitive instanceof Cesium.Model) {
                const model = pickedObject.primitive;
                lastHoveredModel = model;
                model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // CLICK: detect model click OR cctv billboard click
        handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
            const pickedObject = viewer.scene.pick(click.position);

            // Check if a CCTV billboard entity was clicked
            if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
                const entity = pickedObject.id as Cesium.Entity;
                const props = entity.properties?.getValue(Cesium.JulianDate.now());

                if (props?.type === 'cctv') {
                    const cctvData = props.cctvData as CctvConfig;
                    if (cctvData) { onCctvClick(cctvData); return; }
                }

                if (props?.type === 'electricity') {
                    const elecData = props.elecData as ElectricityPointConfig;
                    if (elecData) { onElectricityClick(elecData); return; }
                }
            }

            // Otherwise, handle GLB model click
            if (Cesium.defined(pickedObject) && pickedObject.primitive instanceof Cesium.Model) {
                const model = pickedObject.primitive;
                const data = model.id as ModelConfig;

                if (data) {
                    model.color = Cesium.Color.ORANGE;

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
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // =============================================
    // Setup CCTV Billboard Entities
    // =============================================
    function setupCctvBillboards(viewer: Cesium.Viewer) {
        for (const cctv of CCTV_POINTS) {
            const position = Cesium.Cartesian3.fromDegrees(cctv.longitude, cctv.latitude, cctv.height);

            viewer.entities.add({
                position,
                billboard: {
                    image: '/icons/cctv.svg',
                    width: 48,
                    height: 48,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.5, 800, 0.5),
                    translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 1200, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY, // Always visible, not hidden behind terrain
                },
                label: {
                    text: cctv.label,
                    font: '11px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -58),    // above billboard
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.2, 800, 0.4),
                    translucencyByDistance: new Cesium.NearFarScalar(300, 1.0, 900, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                // Attach CCTV metadata so we can detect clicks
                properties: new Cesium.PropertyBag({
                    type: 'cctv',
                    cctvData: cctv,
                }),
            });
        }
    }

    // =============================================
    // Setup Electricity Billboard Entities
    // =============================================
    function setupElectricityBillboards(viewer: Cesium.Viewer) {
        for (const elec of ELECTRICITY_POINTS) {
            const position = Cesium.Cartesian3.fromDegrees(elec.longitude, elec.latitude, elec.height);

            viewer.entities.add({
                position,
                billboard: {
                    image: '/icons/electricity.svg',
                    width: 48,
                    height: 48,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.5, 800, 0.5),
                    translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 1200, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    text: elec.label,
                    font: '11px sans-serif',
                    fillColor: Cesium.Color.fromCssColorString('#facc15'),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -58),
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.2, 800, 0.4),
                    translucencyByDistance: new Cesium.NearFarScalar(300, 1.0, 900, 0.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                properties: new Cesium.PropertyBag({
                    type: 'electricity',
                    elecData: elec,
                }),
            });
        }
    }

    // Reactivity: Orthophoto Toggles
    useEffect(() => {
        if (viewerReady && orthophotoLayerRef.current) {
            orthophotoLayerRef.current.show = showOrthophoto;
            orthophotoLayerRef.current.alpha = orthophotoOpacity;
        }
    }, [showOrthophoto, orthophotoOpacity, viewerReady]);

    // Reactivity: Terrain Toggle
    useEffect(() => {
        if (viewerReady && viewerRef.current && dtmProviderRef.current) {
            if (showDTM) {
                viewerRef.current.terrainProvider = dtmProviderRef.current;
            } else {
                viewerRef.current.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            }
        }
    }, [showDTM, viewerReady]);

    // Reactivity: 3D Models Toggle
    useEffect(() => {
        if (viewerReady) {
            loadedModelsRef.current.forEach(model => {
                model.show = showModels;
            });
        }
    }, [showModels, viewerReady]);

    // Reactivity: Water Level
    useEffect(() => {
        if (viewerReady && viewerRef.current && (viewerRef.current as any)._waterState) {
            (viewerRef.current as any)._waterState.height = waterLevel;
        }
    }, [waterLevel, viewerReady]);

    // Reactivity: Camera Reset
    useEffect(() => {
        if (viewerReady && viewerRef.current && cameraResetTrigger > 0) {
            viewerRef.current.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(112.17619, -8.16051, 300),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: Cesium.Math.toRadians(0)
                },
                duration: 2
            });
        }
    }, [cameraResetTrigger, viewerReady]);

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 0 }}
        />
    );
}
