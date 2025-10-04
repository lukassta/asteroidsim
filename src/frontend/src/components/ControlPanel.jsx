import { useState } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from '../context/CesiumContext'
import './ControlPanel.css'

function ControlPanel() {
  const { viewer, entitiesRef } = useCesium()
  const [markerCount, setMarkerCount] = useState(0)

  // Add a random marker
  const addRandomMarker = () => {
    if (!viewer) return

    const lon = Math.random() * 360 - 180
    const lat = Math.random() * 180 - 90
    const colors = [Cesium.Color.RED, Cesium.Color.BLUE, Cesium.Color.GREEN, Cesium.Color.YELLOW]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 10,
        color: randomColor,
      },
      label: {
        text: `Marker ${markerCount + 1}`,
        font: '14pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -9),
      },
    })

    entitiesRef.current.push(entity)
    setMarkerCount(markerCount + 1)
  }

  // Fly to a specific location
  const flyToLocation = (lon, lat, name) => {
    if (!viewer) return

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1000000),
      duration: 2,
    })
  }

  // Add a 3D box
  const add3DBox = () => {
    if (!viewer) return

    const lon = Math.random() * 360 - 180
    const lat = Math.random() * 180 - 90

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 100000),
      box: {
        dimensions: new Cesium.Cartesian3(200000, 200000, 200000),
        material: Cesium.Color.BLUE.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
      },
    })

    entitiesRef.current.push(entity)

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500000),
      duration: 2,
    })
  }

  // Add a polygon
  const addPolygon = () => {
    if (!viewer) return

    const lon = Math.random() * 360 - 180
    const lat = Math.random() * 180 - 90

    const entity = viewer.entities.add({
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          lon, lat,
          lon + 5, lat,
          lon + 5, lat + 5,
          lon, lat + 5,
        ]),
        material: Cesium.Color.RED.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.BLACK,
      },
    })

    entitiesRef.current.push(entity)

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon + 2.5, lat + 2.5, 1000000),
      duration: 2,
    })
  }

  // Clear all entities
  const clearAll = () => {
    if (!viewer) return

    viewer.entities.removeAll()
    entitiesRef.current = []
    setMarkerCount(0)
  }

  return (
    <div className="control-panel">
      <h2>Cesium Controls</h2>
      
      <div className="section">
        <h3>Add Objects</h3>
        <button onClick={addRandomMarker}>Add Random Marker</button>
        <button onClick={add3DBox}>Add 3D Box</button>
        <button onClick={addPolygon}>Add Polygon</button>
        <button onClick={clearAll} className="danger">Clear All</button>
      </div>

      <div className="section">
        <h3>Navigate</h3>
        <button onClick={() => flyToLocation(-74.006, 40.7128, 'New York')}>
          Fly to New York
        </button>
        <button onClick={() => flyToLocation(2.3522, 48.8566, 'Paris')}>
          Fly to Paris
        </button>
        <button onClick={() => flyToLocation(139.6917, 35.6895, 'Tokyo')}>
          Fly to Tokyo
        </button>
      </div>

      <div className="section">
        <h3>Stats</h3>
        <p>Markers: {markerCount}</p>
        <p>Total Entities: {entitiesRef.current.length}</p>
      </div>
    </div>
  )
}

export default ControlPanel