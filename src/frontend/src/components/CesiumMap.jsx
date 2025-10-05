import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { useCesium } from "../context/CesiumContext";

function CesiumMap({ map }) {
    const { setViewer } = useCesium();
    const cesiumContainerRef = useRef(null);
    const viewerRef = useRef(null);

    // Initialize the Cesium Viewer once
    useEffect(() => {
        if (!cesiumContainerRef.current || viewerRef.current) return;

        const newViewer = new Cesium.Viewer(cesiumContainerRef.current, {
            sceneMode: Cesium.SceneMode.SCENE2D,
            terrainProvider: undefined,
            timeline: false,
            animation: false,
            infoBox: false,
            selectionIndicator: false,
            skyBox: false,
            skyAtmosphere: false,
        });

        viewerRef.current = newViewer;
        setViewer(newViewer);

        return () => {
            newViewer.destroy();
        };
    }, [setViewer]);

    // Only manipulate entities & camera after both viewer and map exist
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !map || !cesiumContainerRef.current) return;

        // This ensures _cesiumWidget is defined
        // Wrap in setTimeout 0 to defer until after DOM paint
        const handle = setTimeout(() => {
            viewer.entities.removeAll();
            viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(
                    map.center.lon,
                    map.center.lat,
                    10000
                ),
            });
        }, 0);

        return () => clearTimeout(handle);
    }, [map]);

    return <div ref={cesiumContainerRef} style={{ width: "100%", height: "500px" }} />;
}

export default CesiumMap;
