import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCesium } from '../context/CesiumContext';
import * as Cesium from 'cesium';
import InfoCard from '../components/InfoCard';
import AsteroidParameterPanel from '../components/AsteroidParameterPanel';

const AsteroidSelectPage = () => {
  const { viewer } = useCesium();
  const location = useLocation();
  const impactLocation = location.state?.impactLocation;

  // Prototype onLaunch function
  const handleAsteroidLaunch = async (params) => {
    console.log('Launching asteroid with parameters:', params);
    console.log('Impact location:', impactLocation);
    
    if (!viewer) {
      console.error('Cesium viewer not initialized');
      return;
    }

    // Extract parameters
    const { diameter, density, velocityKm, entryAngle, azimuth, aimPoint, materialType } = params;
    
    // Format data according to API specification
    const requestData = {
      inputs: {
        diameter_m: diameter,
        density_kg_m3: density,
        material_type: materialType || "sedimentary rock",
        entry_speed_m_s: velocityKm * 1000, // Convert km/s to m/s
        entry_angle_deg: entryAngle,
        azimuth_deg: azimuth,
        aim_point: {
          lat: aimPoint?.lat || impactLocation?.latitude || 0,
          lon: aimPoint?.lon || impactLocation?.longitude || 0
        }
      }
    };

    console.log('Sending data to API:', requestData);

    try {
      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      return result;
    } catch (error) {
      console.error('Error sending data to API:', error);
      throw error;
    }
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
