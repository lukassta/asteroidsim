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

        // Create the viewer with aerial imagery and labels
        viewerRef.current = new Cesium.Viewer(cesiumContainer.current, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            resolutionScale: 1.0,
            scene3DOnly: true,
            baseLayer: Cesium.ImageryLayer.fromProviderAsync(
                Cesium.IonImageryProvider.fromAssetId(
                    3830183
                )
            ),
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
        })



        // Make viewer available to other components
        setViewer(viewerRef.current)

        // Set initial camera position
        viewerRef.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
        })

        // Force canvas to render at higher resolution
        const canvas = viewerRef.current.canvas
        const pixelRatio = 1.0
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        canvas.width = width * pixelRatio
        canvas.height = height * pixelRatio

        // Handle window resize
        const handleResize = () => {
            if (viewerRef.current) {
                viewerRef.current.resize()
                const canvas = viewerRef.current.canvas
                const pixelRatio = window.devicePixelRatio || 1.5
                const width = canvas.clientWidth
                const height = canvas.clientHeight
                canvas.width = width * pixelRatio
                canvas.height = height * pixelRatio
            }
        }

        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            if (viewerRef.current) {
                viewerRef.current.destroy()
                setViewer(null)
            }
        }
    }, [setViewer])


    return (
        <div
            ref={cesiumContainer}
            id="cesiumContainer"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                margin: 0,
                overflow: 'hidden',
                padding: 0,
                zIndex: 0,
                backgroundColor: 'black',
            }}
        />
    )
}

export default CesiumViewer