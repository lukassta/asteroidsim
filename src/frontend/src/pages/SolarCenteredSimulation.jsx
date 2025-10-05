import { useEffect } from 'react';
import { useCesium } from '../context/CesiumContext';
import * as Cesium from 'cesium';

const SolarCenteredSimulation = () => {
  const { viewer } = useCesium();

  useEffect(() => {
    if (!viewer) return;

    // Hide the default globe
    viewer.scene.globe.show = false;

    // Show the skybox with stars
    viewer.scene.skyBox.show = true;

    // Hide the atmosphere
    viewer.scene.skyAtmosphere.show = false;

    // Disable horizon culling to prevent objects from disappearing
    viewer.scene.globe.enableLighting = false;
    if (viewer.scene.globe._surface) {
      viewer.scene.globe._surface._tileProvider._debug.wireframe = false;
    }

    // Extend the camera's far plane to prevent clipping at large distances
    viewer.scene.camera.frustum.far = 1e12; // 1 trillion meters

    // Remove any existing entities
    viewer.entities.removeAll();

    // Create the Sun at the center (0, 0, 0)
    const sunRadius = 696340000; // Sun's radius in meters
    const sunPosition = Cesium.Cartesian3.ZERO;

    const sun = viewer.entities.add({
      name: 'Sun',
      position: sunPosition,
      ellipsoid: {
        radii: new Cesium.Cartesian3(sunRadius, sunRadius, sunRadius),
        material: Cesium.Color.YELLOW.withAlpha(1.0),
        outlineColor: Cesium.Color.ORANGE,
        outlineWidth: 2.0,
        // Disable horizon culling
        fill: true,
      },
      // Disable distance culling so the Sun always appears
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, Number.MAX_VALUE),
      // Keep it visible regardless of view frustum culling
      show: true,
    });

    // Create Earth as a globe next to the Sun
    // Using Earth's actual orbital distance (1 AU = ~149.6 million km)
    const earthDistance = 149600000000; // 1 AU in meters
    const earthRadius = 6371000; // Earth's radius in meters
    const earthPosition = Cesium.Cartesian3.fromElements(earthDistance, 0, 0);

    // Add Earth with realistic size
    viewer.entities.add({
      name: 'Earth',
      position: earthPosition,
      ellipsoid: {
        radii: new Cesium.Cartesian3(earthRadius, earthRadius, earthRadius),
        material: Cesium.Color.BLUE.withAlpha(1.0),
        outlineColor: Cesium.Color.LIGHTBLUE,
        outlineWidth: 1.0,
        fill: true,
      },
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, Number.MAX_VALUE),
      show: true,
    });

    // Add a bright point to mark Earth's location (always visible)
    viewer.entities.add({
      name: 'Earth Marker',
      position: earthPosition,
      point: {
        pixelSize: 10,
        color: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(1.0, 2.0, 1e12, 0.5),
      },
      label: {
        text: 'Earth',
        font: '14pt sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        scaleByDistance: new Cesium.NearFarScalar(1.0, 1.0, 1e12, 0.5),
      },
    });

    // Add Sun marker and label
    viewer.entities.add({
      name: 'Sun Marker',
      position: sunPosition,
      point: {
        pixelSize: 15,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.ORANGE,
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(1.0, 2.0, 1e12, 0.5),
      },
      label: {
        text: 'Sun',
        font: '16pt sans-serif',
        fillColor: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -25),
        scaleByDistance: new Cesium.NearFarScalar(1.0, 1.0, 1e12, 0.5),
      },
    });

    // Draw a line connecting Sun to Earth to show orbital distance
    viewer.entities.add({
      name: 'Earth Orbit Line',
      polyline: {
        positions: [sunPosition, earthPosition],
        width: 2,
        material: Cesium.Color.GRAY.withAlpha(0.5),
        arcType: Cesium.ArcType.NONE,
      },
    });

    // Add a point light at the Sun's position
    viewer.scene.light = new Cesium.DirectionalLight({
      direction: new Cesium.Cartesian3(1, 0, 0),
    });

    // Enable camera controls
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableTranslate = true;
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    viewer.scene.screenSpaceCameraController.enableLook = false;

    // Handle entity selection to lock camera to selected object
    const selectionHandler = viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
      if (selectedEntity) {
        const entityPosition = selectedEntity.position?.getValue(Cesium.JulianDate.now());
        
        if (entityPosition) {
          // Unlock camera from any previous lookAt
          viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          
          // Determine the distance and zoom speed based on which entity is selected
          let distance;
          if (selectedEntity.name === 'Sun' || selectedEntity.name === 'Sun Marker') {
            distance = sunRadius * 5;
            // Default zoom speed for Sun
            viewer.scene.screenSpaceCameraController.zoomEventTypes = [
              Cesium.CameraEventType.WHEEL,
              Cesium.CameraEventType.PINCH
            ];
            viewer.scene.screenSpaceCameraController.wheelZoomFactor = 10.0;
          } else if (selectedEntity.name === 'Earth' || selectedEntity.name === 'Earth Marker') {
            distance = earthRadius * 50;
            // Faster zoom speed for Earth (smaller object)
            viewer.scene.screenSpaceCameraController.zoomEventTypes = [
              Cesium.CameraEventType.WHEEL,
              Cesium.CameraEventType.PINCH
            ];
            viewer.scene.screenSpaceCameraController.wheelZoomFactor = 100.0; // 10x faster
          } else {
            distance = 10000000; // Default distance
            viewer.scene.screenSpaceCameraController.wheelZoomFactor = 10.0;
          }

          // Lock camera to the selected entity
          viewer.camera.lookAt(
            entityPosition,
            new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_FOUR, distance)
          );

          // Enable rotation around the selected object
          viewer.scene.screenSpaceCameraController.enableRotate = true;
          viewer.scene.screenSpaceCameraController.enableZoom = true;
        }
      } else {
        // When nothing is selected, unlock the camera and reset zoom speed
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        viewer.scene.screenSpaceCameraController.wheelZoomFactor = 10.0;
      }
    });

    // Zoom to the Sun initially
    viewer.zoomTo(sun).then(() => {
      // Set the camera to look at the Sun with a nice view angle
      const sunPos = sun.position.getValue(Cesium.JulianDate.now());
      viewer.camera.lookAt(
        sunPos,
        new Cesium.HeadingPitchRange(
          0,
          -Cesium.Math.PI_OVER_FOUR,
          sunRadius * 5 // Distance from the Sun (5x its radius)
        )
      );
    });

    // Cleanup function
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.entities.removeAll();
        if (selectionHandler) {
          selectionHandler();
        }
      }
    };
  }, [viewer]);

  return null;
};

export default SolarCenteredSimulation;
