import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { useCesium } from '../context/CesiumContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, RotateCcw, Upload } from 'lucide-react'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// Available asteroid models with their native model sizes (in model units)
// These are approximate diameters based on the GLTF bounding boxes
const asteroidModels = [
    { 
        value: 'bennu', 
        label: 'Bennu', 
        path: '/src/assets/bennu/Bennu.gltf',
        nativeSize: 550 // Model spans roughly -277 to +274 units, real Bennu is 492m
    },
    { 
        value: 'gaspra', 
        label: 'Gaspra', 
        path: '/src/assets/gaspra/gaspra.gltf',
        nativeSize: 12900 // Model spans roughly -6344 to +6588 units, real Gaspra is ~18km
    },
    { 
        value: 'asteroid2', 
        label: 'Generic Asteroid 2', 
        path: '/src/assets/generic_asteroid_2/generic_asteroid_2.gltf',
        nativeSize: 2 // Model spans roughly -1.18 to +0.82 units
    },
    { 
        value: 'asteroid3', 
        label: 'Generic Asteroid 3', 
        path: '/src/assets/generic_asteroid_3/generic_asteroid_3.gltf',
        nativeSize: 2 // Model spans roughly -1.03 to +0.97 units
    }
]

const AsteroidSimulationPage = () => {
    const { setViewer } = useCesium()
    const cesiumContainer = useRef(null)
    const viewerRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [czmlData, setCzmlData] = useState(null)
    const [selectedAsteroid, setSelectedAsteroid] = useState('bennu')
    const [czmlSource, setCzmlSource] = useState(null)
    const [asteroidSize, setAsteroidSize] = useState(500) // Size in meters
    const [cartesianInput, setCartesianInput] = useState('[0, 6378137, 0, 0]') // Cartesian coordinates input
    const fileInputRef = useRef(null)

    // Calculate scale factor based on asteroid size in meters
    const calculateScale = (sizeInMeters, modelValue) => {
        // Find the model's native size
        const model = asteroidModels.find(m => m.value === modelValue)
        if (!model || !model.nativeSize) {
            console.warn(`Model ${modelValue} has no native size, using 1:1 scale`)
            return 1
        }
        
        // Calculate scale: desired size / native model size
        // If model native size is 550 units and we want 500 meters, scale = 500/550 ≈ 0.909
        const scale = sizeInMeters / model.nativeSize
        console.log(`Model: ${modelValue}, Native: ${model.nativeSize}, Desired: ${sizeInMeters}m, Scale: ${scale.toFixed(3)}`)
        return scale
    }

    // Initialize Cesium Viewer
    useEffect(() => {
        if (!cesiumContainer.current || viewerRef.current) return

        // Set Cesium Ion access token
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYmQwNDcxYi1hNzg0LTQ5MDMtOGU5OC1iMjAzMTE1NDBiMDkiLCJpZCI6MzQ2OTAzLCJpYXQiOjE3NTk1MDMzMDl9.evML2LxnRfcQ_WY8dGa8YzObvbt25oz6GfXdxGaG_eY'

        // Create viewer
        viewerRef.current = new Cesium.Viewer(cesiumContainer.current, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            resolutionScale: 1.0,
            scene3DOnly: false,
            baseLayer: Cesium.ImageryLayer.fromProviderAsync(
                Cesium.IonImageryProvider.fromAssetId(2)
            ),
            baseLayerPicker: false,
            geocoder: false,
            homeButton: true,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: true,
            timeline: true,
            fullscreenButton: false,
            infoBox: true,
            selectionIndicator: true,
        })

        // Enable lighting
        viewerRef.current.scene.globe.enableLighting = true
        viewerRef.current.scene.globe.atmosphereLightIntensity = 20.0

        // Set initial camera view - view Earth from space
        viewerRef.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 25000000),
            orientation: {
                heading: 0.0,
                pitch: -Cesium.Math.PI_OVER_TWO,
                roll: 0.0
            }
        })

        // Make viewer available through context
        setViewer(viewerRef.current)

        // Handle window resize
        const handleResize = () => {
            if (viewerRef.current) {
                viewerRef.current.resize()
            }
        }

        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                viewerRef.current.destroy()
                viewerRef.current = null
                setViewer(null)
            }
        }
    }, [setViewer])

    // Load CZML data
    const loadCzmlData = async (czmlJson) => {
        if (!viewerRef.current) return

        try {
            // Remove existing CZML data source if any
            if (czmlSource) {
                viewerRef.current.dataSources.remove(czmlSource)
            }

            // Load new CZML data
            const dataSource = await Cesium.CzmlDataSource.load(czmlJson)
            await viewerRef.current.dataSources.add(dataSource)
            setCzmlSource(dataSource)

            // Find the asteroid entity and update its model
            const entities = dataSource.entities.values
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i]
                if (entity.id.toLowerCase().includes('asteroid') || entity.model) {
                    // Update the model to use selected asteroid
                    const asteroidModel = asteroidModels.find(a => a.value === selectedAsteroid)
                    if (asteroidModel) {
                        const scale = calculateScale(asteroidSize, selectedAsteroid)
                        entity.model = new Cesium.ModelGraphics({
                            uri: asteroidModel.path,
                            scale: scale
                        })
                    }
                    
                    // Add label to the asteroid
                    entity.label = new Cesium.LabelGraphics({
                        text: `Asteroid (${asteroidSize}m)`,
                        font: '14pt sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -20)
                    })

                    // Track the asteroid
                    viewerRef.current.trackedEntity = entity
                }
            }

            // Start animation
            viewerRef.current.clock.shouldAnimate = true
            setIsPlaying(true)

            console.log('CZML data loaded successfully')
        } catch (error) {
            console.error('Error loading CZML data:', error)
            alert('Error loading CZML data. Please check the file format.')
        }
    }

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result)
                setCzmlData(json)
                loadCzmlData(json)
            } catch (error) {
                console.error('Error parsing CZML file:', error)
                alert('Invalid CZML file format')
            }
        }
        reader.readAsText(file)
    }

    // Create a CZML trajectory with custom Cartesian coordinates
    const createSampleTrajectory = () => {
        try {
            // Parse the cartesian input
            let cartesianArray
            try {
                cartesianArray = JSON.parse(cartesianInput)
                if (!Array.isArray(cartesianArray)) {
                    throw new Error('Input must be an array')
                }
            } catch {
                alert('Invalid Cartesian format. Please provide a valid array like [0, 6378137, 0, 0]')
                return
            }

            const czml = [
                {
                    id: "document",
                    name: "Sample Asteroid Near-Earth Trajectory",
                    version: "1.0",
                    clock: {
                        interval: "2024-10-05T00:00:00Z/2024-10-05T06:00:00Z",
                        currentTime: "2024-10-05T00:00:00Z",
                        multiplier: 1,
                        range: "LOOP_STOP",
                        step: "SYSTEM_CLOCK_MULTIPLIER"
                    }
                },
                {
                    id: "asteroid_apophis",
                    name: "Sample Near-Earth Asteroid",
                    description: "A sample asteroid trajectory demonstrating a close Earth approach",
                    availability: "2024-10-05T00:00:00Z/2024-10-05T06:00:00Z",
                    position: {
                        epoch: "2024-10-05T00:00:00Z",
                        interpolationAlgorithm: "LAGRANGE",
                        interpolationDegree: 5,
                        referenceFrame: "INERTIAL",
                        cartesian: cartesianArray
                    },
                    label: {
                        text: "Near-Earth Asteroid",
                        font: "14pt monospace",
                        style: "FILL_AND_OUTLINE",
                        fillColor: {
                            rgba: [255, 255, 255, 255]
                        },
                        outlineColor: {
                            rgba: [0, 0, 0, 255]
                        },
                        outlineWidth: 2,
                        horizontalOrigin: "LEFT",
                        pixelOffset: {
                            cartesian2: [12, 0]
                        },
                        show: true
                    },
                    path: {
                        show: true,
                        leadTime: 0,
                        trailTime: 21600,
                        width: 3,
                        resolution: 120,
                        material: {
                            solidColor: {
                                color: {
                                    rgba: [255, 165, 0, 255]
                                }
                            }
                        }
                    }
                }
            ]

            setCzmlData(czml)
            loadCzmlData(czml)
        } catch (error) {
            console.error('Error creating trajectory:', error)
            alert('Error creating trajectory. Please check your input.')
        }
    }



    // Playback controls
    const togglePlayback = () => {
        if (!viewerRef.current) return
        
        const shouldAnimate = !viewerRef.current.clock.shouldAnimate
        viewerRef.current.clock.shouldAnimate = shouldAnimate
        setIsPlaying(shouldAnimate)
    }

    const resetSimulation = () => {
        if (!viewerRef.current || !czmlData) return
        
        viewerRef.current.clock.currentTime = viewerRef.current.clock.startTime.clone()
        viewerRef.current.clock.shouldAnimate = false
        setIsPlaying(false)
    }

    // Update asteroid model when selection or size changes
    useEffect(() => {
        if (czmlSource && viewerRef.current) {
            const entities = czmlSource.entities.values
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i]
                if (entity.id.toLowerCase().includes('asteroid') || entity.model) {
                    const asteroidModel = asteroidModels.find(a => a.value === selectedAsteroid)
                    if (asteroidModel) {
                        const scale = calculateScale(asteroidSize, selectedAsteroid)
                        entity.model = new Cesium.ModelGraphics({
                            uri: asteroidModel.path,
                            scale: scale
                        })
                    }
                    // Update label with size
                    if (entity.label) {
                        entity.label.text = new Cesium.ConstantProperty(`Asteroid (${asteroidSize}m)`)
                    }
                }
            }
        }
    }, [selectedAsteroid, asteroidSize, czmlSource])

    return (
        <div className="relative w-full h-screen bg-black">
            {/* Cesium Container */}
            <div
                ref={cesiumContainer}
                className="absolute top-0 left-0 w-full h-full"
            />

            {/* Control Panel */}
            <Card className="absolute top-18 left-4 w-80 bg-slate-900/95 backdrop-blur-sm border-slate-700 text-slate-100 z-10">
                <CardHeader>
                    <CardTitle>Asteroid Trajectory Simulator</CardTitle>
                    <CardDescription className="text-slate-400">
                        Load CZML path data to animate asteroid trajectory
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Asteroid Model Selection */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Asteroid Model</Label>
                        <Select value={selectedAsteroid} onValueChange={setSelectedAsteroid}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600 text-slate-100">
                                {asteroidModels.map(model => (
                                    <SelectItem key={model.value} value={model.value}>
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Asteroid Size */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Asteroid Size: {asteroidSize}m</Label>
                        <div className="flex items-center gap-3">
                            <Slider
                                value={[asteroidSize]}
                                onValueChange={(val) => setAsteroidSize(val[0])}
                                min={10}
                                max={2000}
                                step={10}
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                value={asteroidSize}
                                onChange={(e) => setAsteroidSize(Number(e.target.value))}
                                min={10}
                                max={10000}
                                step={10}
                                className="w-20 bg-slate-800 border-slate-600 text-slate-100
                                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <p className="text-xs text-slate-400">
                            Reference: Bennu (492m), Tunguska (60m), Chelyabinsk (20m)
                        </p>
                        <p className="text-xs text-blue-400">
                            Scale factor: {calculateScale(asteroidSize, selectedAsteroid).toFixed(3)}x
                        </p>
                    </div>

                    {/* Cartesian Coordinates Input */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Cartesian Coordinates</Label>
                        <Input
                            type="text"
                            value={cartesianInput}
                            onChange={(e) => setCartesianInput(e.target.value)}
                            placeholder="[0, 6378137, 0, 0]"
                            className="bg-slate-800 border-slate-600 text-slate-100 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-400">
                            Enter array format: [time, x, y, z, ...]
                        </p>
                    </div>

                    {/* Generate Trajectory Button */}
                    <Button
                        onClick={createSampleTrajectory}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        Generate Trajectory
                    </Button>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Or Upload CZML File</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".czml,.json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="w-full bg-slate-800 border-slate-600 hover:bg-slate-700"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload CZML
                        </Button>
                    </div>

                    {/* Playback Controls */}
                    {czmlData && (
                        <div className="flex gap-2 pt-2 border-t border-slate-700">
                            <Button
                                onClick={togglePlayback}
                                variant="outline"
                                className="flex-1 bg-slate-800 border-slate-600 hover:bg-slate-700"
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-2" />
                                        Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Play
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={resetSimulation}
                                variant="outline"
                                className="bg-slate-800 border-slate-600 hover:bg-slate-700"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default AsteroidSimulationPage
