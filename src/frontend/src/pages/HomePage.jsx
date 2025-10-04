import { useEffect } from 'react';
import { useCesium } from '../context/CesiumContext';
import * as Cesium from 'cesium';
import InfoCard from '../components/InfoCard';

const HomePage = () => {
  const { viewer } = useCesium();

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
      duration: 2.0
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

  return (
    <InfoCard
      title="Welcome to AsteroidSim"
      description="Explore asteroids and celestial bodies"
      content={
        <div>
          <p className="text-gray-300">
            Navigate through space and discover the wonders of our solar system.
            Use the navigation bar above to explore different features.
          </p>
        </div>
      }
      footer={null}
      className="w-full max-w-md"
    />
  );
};

export default HomePage;
