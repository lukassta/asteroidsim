import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCesium } from '../context/CesiumContext';
import * as Cesium from 'cesium';
import InfoCard from '../components/InfoCard';
import { Button } from '../components/ui/button';

const HomePage = () => {
  const { viewer } = useCesium();
  const navigate = useNavigate();
  const selectedPointRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (!viewer) return;

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

    // Add click handler for picking locations on the globe
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      // Use scene.pickPosition for more accurate terrain-aware picking
      const pickedPosition = viewer.scene.pickPosition(click.position);
      
      // Fallback to camera.pickEllipsoid if pickPosition doesn't return a valid position
      const cartesian = pickedPosition || viewer.camera.pickEllipsoid(
        click.position,
        viewer.scene.globe.ellipsoid
      );

      if (cartesian) {
        // Convert cartesian to cartographic (lat/lon)
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;

        console.log(`Clicked location: Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}, Height: ${height.toFixed(2)}m`);

        // Store the selected location
        setSelectedLocation({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          height: height.toFixed(2)
        });

        // Remove previous point if it exists
        if (selectedPointRef.current) {
          viewer.entities.remove(selectedPointRef.current);
        }

        // Add a high-quality point entity at the clicked location
        selectedPointRef.current = viewer.entities.add({
          position: cartesian,
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#FF4444'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // Always visible
            scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.5, 1.0e7, 0.5), // Scale based on distance
          },
          description: `Latitude: ${latitude.toFixed(6)}°<br/>Longitude: ${longitude.toFixed(6)}°<br/>Height: ${height.toFixed(2)}m`
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Cleanup
    return () => {
      if (handler) {
        handler.destroy();
      }
      // Remove point when leaving the page
      if (selectedPointRef.current) {
        viewer.entities.remove(selectedPointRef.current);
        selectedPointRef.current = null;
      }
      setSelectedLocation(null);
    };
  }, [viewer]);

  const handleSimulate = () => {
    console.log('Simulating impact at:', selectedLocation);
    // Navigate to asteroid selection page with location data
    navigate('/asteroid-select', { state: { impactLocation: selectedLocation } });
  };

  return (
    <>
      {!selectedLocation ? (
        <InfoCard
          title="Welcome to AsteroidSim"
          description="Explore asteroids and celestial bodies"
          content={
            <div>
              <p className="text-gray-400 mt-4">
                Click anywhere on the globe to mark where the asteroid enters the atmosphere.
              </p>
            </div>
          }
          footer={null}
          className="w-full max-w-md"
        />
      ) : (
        <InfoCard
          title="Selected Location"
          description="Impact target coordinates"
          content={
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Latitude:</span>
                <span className="text-slate-100 font-mono">{selectedLocation.latitude}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Longitude:</span>
                <span className="text-slate-100 font-mono">{selectedLocation.longitude}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Elevation:</span>
                <span className="text-slate-100 font-mono">{selectedLocation.height} m</span>
              </div>
            </div>
          }
          footer={
            <div className="w-full flex gap-2">
              <Button
                onClick={handleSimulate}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Simulate
              </Button>
            </div>
          }
          className="w-full max-w-md"
        />
      )}
    </>
  );
};

export default HomePage;
