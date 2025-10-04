import { useEffect } from 'react';
import { useCesium } from '../context/CesiumContext';
import * as Cesium from 'cesium';
import InfoCard from '../components/InfoCard';
import AsteroidParameterPanel from '../components/AsteroidParameterPanel';

const AsteroidSelectPage = () => {
  const { viewer } = useCesium();

  // Prototype onLaunch function
  const handleAsteroidLaunch = (params) => {
    console.log('Launching asteroid with parameters:', params);
    
    if (!viewer) {
      console.error('Cesium viewer not initialized');
      return;
    }

    // Extract parameters
    const { diameter, density, velocityKm, entryAngle, azimuth, aimPoint } = params;
    
    // Calculate mass from diameter and density
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * density;
    
    // Log calculated values
    console.log('Calculated mass:', mass.toFixed(2), 'kg');
    console.log('Velocity:', velocityKm, 'km/s');
    console.log('Entry angle:', entryAngle, '° (horizontal)');
    console.log('Azimuth:', azimuth, '°');
    console.log('Aim point:', aimPoint);
  };

  useEffect(() => {
    if (!viewer) return;

    // Hide the globe
    viewer.scene.globe.show = false;
    
    // Hide the atmosphere (removes the blue sky)
    viewer.scene.skyAtmosphere.show = false;
    
    // Enable the skybox with stars
    viewer.scene.skyBox.show = true;

    // Remove any existing entities
    viewer.entities.removeAll();

    // Load the Bennu asteroid model
    const position = Cesium.Cartesian3.fromDegrees(0, 0, 0);
    
    const heading = Cesium.Math.toRadians(0);
    const pitch = 0;
    const roll = 0;
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    const entity = viewer.entities.add({
      name: 'Bennu Asteroid',
      position: position,
      orientation: orientation,
      model: {
        uri: '/src/assets/bennu/Bennu.gltf',
        minimumPixelSize: 128,
        maximumScale: 20000,
      },
    });

    // Zoom to the model and set up orbit rotation
    viewer.zoomTo(entity).then(() => {
      // Enable rotation around the model
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableTranslate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      viewer.scene.screenSpaceCameraController.enableLook = false;
      
      // Set the camera to look at the model's position
      const modelPosition = entity.position.getValue(Cesium.JulianDate.now());
      viewer.camera.lookAt(
        modelPosition,
        new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_FOUR, 2500)
      );
      
      // Set the rotation center to the model's position
      viewer.scene.screenSpaceCameraController.lookEventTypes = [
        Cesium.CameraEventType.LEFT_DRAG
      ];
    });
  }, [viewer]);

  /*return (
    <InfoCard
      title="Asteroid: Bennu"
      description="101955 Bennu - Near-Earth asteroid"
      content={
        <div className="space-y-2">
          <div className="text-sm text-gray-300">
            <strong>Type:</strong> B-type asteroid
          </div>
          <div className="text-sm text-gray-300">
            <strong>Diameter:</strong> ~490 meters
          </div>
          <div className="text-sm text-gray-300">
            <strong>Discovered:</strong> September 11, 1999
          </div>
          <div className="text-sm text-gray-400 mt-4">
            Use your mouse to rotate and zoom around the asteroid.
          </div>
        </div>
      }
      footer={null}
      className="w-full max-w-md"
    />
  );*/

  return (
    <AsteroidParameterPanel onLaunch={handleAsteroidLaunch} />
  )
};

export default AsteroidSelectPage;
