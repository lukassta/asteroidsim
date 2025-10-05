import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import * as Cesium from "cesium";
import PanelCard from "../components/PanelCard";
import MetaCard from "../components/MetaCard";
import { fetchSimulation } from "../utils/fetchSimulation";
import { useCesium } from "../context/CesiumContext";
import CesiumViewer from "../CesiumViewer";

// Helper function to normalize simulation data and ensure all numbers are properly typed
function normalizeSimulationData(data) {
    if (!data || !data.map || !data.panel || !data.meta) {
        return null;
    }

    return {
        id: data.id,
        map: {
            center: {
                lat: parseFloat(data.map.center.lat),
                lon: parseFloat(data.map.center.lon)
            },
            crater_transient_diameter_m: parseFloat(data.map.crater_transient_diameter_m),
            crater_final_diameter_m: parseFloat(data.map.crater_final_diameter_m),
            rings: data.map.rings.map(ring => ({
                ...ring,
                threshold_kpa: parseFloat(ring.threshold_kpa),
                radius_m: parseFloat(ring.radius_m)
            }))
        },
        panel: {
            energy_released_megatons: parseFloat(data.panel.energy_released_megatons),
            crater_final: {
                formed: data.panel.crater_final.formed,
                diameter_m: parseFloat(data.panel.crater_final.diameter_m),
                depth_m: parseFloat(data.panel.crater_final.depth_m)
            },
            rings: data.panel.rings.map(ring => ({
                ...ring,
                threshold_kpa: parseFloat(ring.threshold_kpa),
                radius_m: parseFloat(ring.radius_m),
                arrival_time_s: parseFloat(ring.arrival_time_s),
                delta_to_next_s: parseFloat(ring.delta_to_next_s),
                population: parseInt(ring.population, 10),
                estimated_deaths: parseInt(ring.estimated_deaths, 10)
            })),
            totals: data.panel.totals ? {
                total_estimated_deaths: parseInt(data.panel.totals.total_estimated_deaths, 10)
            } : { total_estimated_deaths: 0 }
        },
        meta: data.meta
    };
}

export default function ImpactEffectPage() {
    const location = useLocation();
    const simulationData = location.state?.simulationData;
    
    console.log("ImpactEffectPage mounted - location.state:", location.state);
    console.log("simulationData:", simulationData);
    console.log("simulationData keys:", simulationData ? Object.keys(simulationData) : "none");
    
    // Normalize and initialize state with simulationData if available
    const normalizedData = simulationData ? normalizeSimulationData(simulationData) : null;
    
    const [id, setId] = useState(normalizedData?.id || "");
    const [map, setMap] = useState(normalizedData?.map || null);
    const [panel, setPanel] = useState(normalizedData?.panel || null);
    const [meta, setMeta] = useState(normalizedData?.meta || null);
    const { viewer, entitiesRef } = useCesium();
    
    console.log("Initial state - map:", !!map, "panel:", !!panel, "meta:", !!meta);

    // Reset Cesium viewer to globe view when component mounts
    useEffect(() => {
        if (!viewer) {
            console.log("Viewer not ready yet for globe reset");
            return;
        }

        console.log("Resetting Cesium viewer to globe view");

        // Show the globe
        viewer.scene.globe.show = true;

        // Show the atmosphere (blue sky)
        viewer.scene.skyAtmosphere.show = true;

        // Show the skybox
        viewer.scene.skyBox.show = true;

        // Remove any asteroid entities
        viewer.entities.removeAll();

        // Release the camera from lookAt mode
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

        // Reset camera to default globe view
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
            duration: 0.0
        });

        // Reset camera controls to default for Earth rotation
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        viewer.scene.screenSpaceCameraController.enableTranslate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = true;
        viewer.scene.screenSpaceCameraController.enableTilt = true;
        viewer.scene.screenSpaceCameraController.enableLook = false;

        // Set rotation event types - left drag for rotation only
        viewer.scene.screenSpaceCameraController.rotateEventTypes = [
            Cesium.CameraEventType.LEFT_DRAG
        ];

        // Clear translate event types to prevent panning
        viewer.scene.screenSpaceCameraController.translateEventTypes = [];
    }, [viewer]);

    useEffect(() => {
        // If we don't have data yet (not initialized in state), fetch it
        if (!map && !panel && !meta) {
            if (simulationData) {
                // Use data from navigation state
                console.log("Using simulation data from navigation:", simulationData);
                console.log("simulationData.map exists?", !!simulationData.map);
                console.log("simulationData.panel exists?", !!simulationData.panel);
                console.log("simulationData.meta exists?", !!simulationData.meta);
                
                // Check if data is nested in a 'result' or 'data' property
                const dataSource = simulationData.result || simulationData.data || simulationData;
                console.log("Using dataSource:", dataSource);
                console.log("dataSource.map:", dataSource.map);
                
                const normalized = normalizeSimulationData(dataSource);
                
                if (!normalized) {
                    console.error("Invalid simulation data structure! Missing required fields.");
                    console.log("Falling back to fetch default simulation...");
                    // Fallback to fetching example data
                    fetchSimulation().then((data) => {
                        console.log("Fetched fallback simulation data:", data);
                        const normalizedFallback = normalizeSimulationData(data);
                        if (normalizedFallback) {
                            setId(normalizedFallback.id);
                            setMap(normalizedFallback.map);
                            setPanel(normalizedFallback.panel);
                            setMeta(normalizedFallback.meta);
                        }
                    }).catch((error) => {
                        console.error("Error fetching fallback simulation data:", error);
                    });
                } else {
                    setId(normalized.id);
                    setMap(normalized.map);
                    setPanel(normalized.panel);
                    setMeta(normalized.meta);
                }
            } else {
                // Otherwise, fetch from the GET endpoint (fallback for direct navigation)
                console.log("No simulation data in navigation state, fetching from API...");
                fetchSimulation().then((data) => {
                    console.log("Fetched simulation data:", data);
                    const normalized = normalizeSimulationData(data);
                    if (normalized) {
                        setId(normalized.id);
                        setMap(normalized.map);
                        setPanel(normalized.panel);
                        setMeta(normalized.meta);
                    }
                }).catch((error) => {
                    console.error("Error fetching simulation data:", error);
                });
            }
        }
    }, [simulationData, map, panel, meta]);

    // Render crater rings on the map
    useEffect(() => {
        if (!viewer || !map) {
            console.log("Crater rendering skipped - viewer or map not ready:", { viewer: !!viewer, map: !!map });
            return;
        }

        console.log("Rendering crater rings with map data:", map);

        // Clear existing entities
        entitiesRef.current.forEach(entity => {
            viewer.entities.remove(entity);
        });
        entitiesRef.current = [];

        const { center, crater_transient_diameter_m, crater_final_diameter_m, rings } = map;

        // Add the crater center marker
        const centerEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat),
            point: {
                pixelSize: 10,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
            },
            label: {
                text: "Impact Center",
                font: "14px sans-serif",
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                showBackground: true,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                backgroundPadding: new Cesium.Cartesian2(7, 5),
            },
        });
        entitiesRef.current.push(centerEntity);

        // Add transient crater circle
        const transientCraterEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat),
            ellipse: {
                semiMinorAxis: crater_transient_diameter_m / 2,
                semiMajorAxis: crater_transient_diameter_m / 2,
                material: Cesium.Color.ORANGE.withAlpha(0.3),
                outline: true,
                outlineColor: Cesium.Color.ORANGE,
                outlineWidth: 2,
            },
            label: {
                text: `Transient Crater: ${(crater_transient_diameter_m / 1000).toFixed(2)} km`,
                font: "12px sans-serif",
                fillColor: Cesium.Color.ORANGE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, 20),
                showBackground: true,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                backgroundPadding: new Cesium.Cartesian2(7, 5),
            },
        });
        entitiesRef.current.push(transientCraterEntity);

        // Add final crater circle
        const finalCraterEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat),
            ellipse: {
                semiMinorAxis: crater_final_diameter_m / 2,
                semiMajorAxis: crater_final_diameter_m / 2,
                material: Cesium.Color.RED.withAlpha(0.3),
                outline: true,
                outlineColor: Cesium.Color.RED,
                outlineWidth: 2,
            },
            label: {
                text: `Final Crater: ${(crater_final_diameter_m / 1000).toFixed(2)} km`,
                font: "12px sans-serif",
                fillColor: Cesium.Color.RED,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, 40),
                showBackground: true,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                backgroundPadding: new Cesium.Cartesian2(7, 5),
            },
        });
        entitiesRef.current.push(finalCraterEntity);

        // Color scale for pressure rings (from high to low pressure)
        const colors = [
            Cesium.Color.DARKRED,
            Cesium.Color.RED,
            Cesium.Color.ORANGE,
            Cesium.Color.YELLOW,
            Cesium.Color.GREENYELLOW,
            Cesium.Color.CYAN,
        ];

        // Add pressure rings
        rings.forEach((ring, index) => {
            const color = colors[index] || Cesium.Color.GRAY;

            // Create the ring ellipse
            const ringEntity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat),
                ellipse: {
                    semiMinorAxis: ring.radius_m,
                    semiMajorAxis: ring.radius_m,
                    material: color.withAlpha(0.1),
                    outline: true,
                    outlineColor: color,
                    outlineWidth: 2,
                },
            });
            entitiesRef.current.push(ringEntity);

            // Calculate position on the ring's circumference (45 degrees from north)
            const bearing = 45; // degrees from north
            const distance = ring.radius_m;

            // Calculate the position on the ring using geodesic calculation
            const earthRadius = 6371000; // meters
            const angularDistance = distance / earthRadius;
            const bearingRad = Cesium.Math.toRadians(bearing);
            const latRad = Cesium.Math.toRadians(center.lat);
            const lonRad = Cesium.Math.toRadians(center.lon);

            const newLatRad = Math.asin(
                Math.sin(latRad) * Math.cos(angularDistance) +
                Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
            );

            const newLonRad = lonRad + Math.atan2(
                Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
                Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
            );

            const labelLat = Cesium.Math.toDegrees(newLatRad);
            const labelLon = Cesium.Math.toDegrees(newLonRad);

            // Add label at the calculated position on the ring
            const labelEntity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(labelLon, labelLat),
                label: {
                    text: `${ring.threshold_kpa} kPa (${(ring.radius_m / 1000).toFixed(1)} km)`,
                    font: "12px sans-serif",
                    fillColor: color,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -15),
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, ring.radius_m * 10),
                    showBackground: true,
                    backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                    backgroundPadding: new Cesium.Cartesian2(7, 5),
                },
            });
            entitiesRef.current.push(labelEntity);
        });

        // Fly camera to the impact site
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                center.lon,
                center.lat,
                rings[rings.length - 1].radius_m * 3 // Zoom out to see all rings
            ),
            duration: 2,
        });

        console.log(`Successfully rendered ${entitiesRef.current.length} entities (center, craters, ${rings.length} rings with labels)`);

        // Cleanup function
        return () => {
            entitiesRef.current.forEach(entity => {
                viewer.entities.remove(entity);
            });
            entitiesRef.current = [];
        };
    }, [viewer, map, entitiesRef]);

    if (!map || !panel || !meta) return (
        <div className="flex items-center justify-center h-screen bg-black text-white">
            <p>Loading simulation...</p>
        </div>
    );

    return (
        <>
            {/* Left Side Panels */}
            <div className="absolute top-16 left-4 w-96 z-10 space-y-4">
                {/* Main Impact Info Card */}
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl text-slate-100">
                    <div className="p-4 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">Impact Effects</h2>
                        <p className="text-sm text-slate-400">
                            Lat: {map.center.lat.toFixed(4)}°, Lon: {map.center.lon.toFixed(4)}°
                        </p>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Energy Released */}
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-300">Energy Released</div>
                            <div className="text-2xl font-bold text-orange-400">
                                {panel.energy_released_megatons.toLocaleString()} MT
                            </div>
                            <div className="text-xs text-slate-400">megatons TNT equivalent</div>
                        </div>

                        {/* Crater Information */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-slate-400">Transient Crater</div>
                                <div className="text-lg font-semibold text-orange-300">
                                    {(map.crater_transient_diameter_m / 1000).toFixed(2)} km
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-slate-400">Final Crater</div>
                                <div className="text-lg font-semibold text-red-400">
                                    {(panel.crater_final.diameter_m / 1000).toFixed(2)} km
                                </div>
                            </div>
                        </div>

                        {/* Total Casualties */}
                        <div className="pt-3 border-t border-slate-700">
                            <div className="text-sm font-medium text-slate-300 mb-1">Total Estimated Deaths</div>
                            <div className="text-3xl font-bold text-red-500">
                                {panel.totals.total_estimated_deaths.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Information Card */}
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl text-slate-100">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-white">Simulation Info</h3>
                    </div>

                    <div className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Version:</span>
                            <span className="text-slate-200 font-mono">{meta.version}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Units:</span>
                            <span className="text-slate-200">{meta.units}</span>
                        </div>

                        {meta.notes && meta.notes.length > 0 && (
                            <div className="pt-2 border-t border-slate-700">
                                <div className="text-slate-400 mb-2">Notes:</div>
                                <ul className="space-y-1 text-xs text-slate-300">
                                    {meta.notes.map((note, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <span className="mr-2 text-slate-500">•</span>
                                            <span>{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side Panel */}
            <div className="absolute top-16 right-4 w-96 z-10">
                {/* Pressure Rings Card */}
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl text-slate-100">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-white">Pressure Rings</h3>
                        <p className="text-xs text-slate-400">Overpressure zones and casualties</p>
                    </div>

                    <div className="p-4 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        {panel.rings.map((ring, idx) => {
                            const colors = [
                                { bg: 'bg-red-950/50', border: 'border-red-700', text: 'text-red-400' },
                                { bg: 'bg-red-900/50', border: 'border-red-600', text: 'text-red-300' },
                                { bg: 'bg-orange-900/50', border: 'border-orange-600', text: 'text-orange-300' },
                                { bg: 'bg-yellow-900/50', border: 'border-yellow-600', text: 'text-yellow-300' },
                                { bg: 'bg-lime-900/50', border: 'border-lime-600', text: 'text-lime-300' },
                                { bg: 'bg-cyan-900/50', border: 'border-cyan-600', text: 'text-cyan-300' }
                            ];
                            const color = colors[idx] || colors[colors.length - 1];

                            return (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${color.bg} ${color.border}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`text-lg font-bold ${color.text}`}>
                                            {ring.threshold_kpa} kPa
                                        </div>
                                        <div className="text-sm text-slate-300">
                                            {(ring.radius_m / 1000).toFixed(1)} km
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between text-slate-300">
                                            <span>Population:</span>
                                            <span className="font-semibold">{ring.population.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>Est. Deaths:</span>
                                            <span className="font-semibold text-red-400">
                                                {ring.estimated_deaths.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {ring.blurb && (
                                        <p className="mt-2 text-xs text-slate-400 italic">
                                            {ring.blurb}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
