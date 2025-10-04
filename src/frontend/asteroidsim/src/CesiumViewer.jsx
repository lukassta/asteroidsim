import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from './context/CesiumContext.jsx'
import 'cesium/Build/Cesium/Widgets/widgets.css'

function CesiumViewer() {
    const { setViewer } = useCesium()
    const viewerRef = useRef(null)
    const cesiumContainer = useRef(null)

    useEffect(() => {
        if (!cesiumContainer.current) return

        // Set your Cesium Ion access token
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYmQwNDcxYi1hNzg0LTQ5MDMtOGU5OC1iMjAzMTE1NDBiMDkiLCJpZCI6MzQ2OTAzLCJpYXQiOjE3NTk1MDMzMDl9.evML2LxnRfcQ_WY8dGa8YzObvbt25oz6GfXdxGaG_eY'

        // Create the viewer
        viewerRef.current = new Cesium.Viewer(cesiumContainer.current, {
            terrain: Cesium.Terrain.fromWorldTerrain()
        })



        // Make viewer available to other components
        setViewer(viewerRef.current)

        // Set initial camera position
        viewerRef.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
        })


        // Cleanup
        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy()
                setViewer(null)
            }
        }
    }, [setViewer])


    return (
        <div
            ref={cesiumContainer}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                margin: 0,
                overflow: 'hidden',
                padding: 0,
            }}
        />
    )
}

export default CesiumViewer