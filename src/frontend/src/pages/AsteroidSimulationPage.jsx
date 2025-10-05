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

// Available asteroid models
const asteroidModels = [
    { value: 'bennu', label: 'Bennu', path: '/src/assets/bennu/Bennu.gltf' },
    { value: 'gaspra', label: 'Gaspra', path: '/src/assets/gaspra/gaspra.gltf' },
    { value: 'asteroid2', label: 'Generic Asteroid 2', path: '/src/assets/generic_asteroid_2/generic_asteroid_2.gltf' },
    { value: 'asteroid3', label: 'Generic Asteroid 3', path: '/src/assets/generic_asteroid_3/generic_asteroid_3.gltf' }
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
    const fileInputRef = useRef(null)

    // Calculate scale factor based on asteroid size in meters
    const calculateScale = (sizeInMeters) => {
        // Base scale factor - adjust this to match your model's native size
        // Assuming models are roughly 1 unit = 1 meter in the GLTF file
        return sizeInMeters
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
                        const scale = calculateScale(asteroidSize)
                        entity.model = new Cesium.ModelGraphics({
                            uri: asteroidModel.path,
                            minimumPixelSize: 64,
                            maximumScale: 50000,
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

    // Create a sample CZML trajectory
    const createSampleTrajectory = () => {
        const startTime = Cesium.JulianDate.now()
        const stopTime = Cesium.JulianDate.addSeconds(startTime, 3600, new Cesium.JulianDate())

        const czml = [
            {
                id: "document",
                name: "Sample Asteroid Trajectory",
                version: "1.0",
                clock: {
                    interval: `${Cesium.JulianDate.toIso8601(startTime)}/${Cesium.JulianDate.toIso8601(stopTime)}`,
                    currentTime: Cesium.JulianDate.toIso8601(startTime),
                    multiplier: 10,
                    range: "LOOP_STOP",
                    step: "SYSTEM_CLOCK_MULTIPLIER"
                }
            },
            {
                id: "asteroid_sample",
                name: "Sample Asteroid",
                availability: `${Cesium.JulianDate.toIso8601(startTime)}/${Cesium.JulianDate.toIso8601(stopTime)}`,
                position: {
                    epoch: Cesium.JulianDate.toIso8601(startTime),
                    cartographicDegrees: generateOrbitPath(startTime, 3600)
                },
                model: {
                    gltf: asteroidModels.find(a => a.value === selectedAsteroid)?.path || asteroidModels[0].path,
                    minimumPixelSize: 64,
                    maximumScale: 50000,
                    scale: calculateScale(asteroidSize)
                },
                path: {
                    material: {
                        polylineOutline: {
                            color: {
                                rgba: [255, 255, 0, 255]
                            },
                            outlineColor: {
                                rgba: [255, 0, 0, 255]
                            },
                            outlineWidth: 2
                        }
                    },
                    width: 3,
                    leadTime: 0,
                    trailTime: 3600,
                    resolution: 5
                }
            }
        ]

        setCzmlData(czml)
        loadCzmlData(czml)
    }

    // Generate orbital path (simple elliptical orbit around Earth)
    const generateOrbitPath = (startTime, duration) => {
        const positions = []
        const steps = 100
        const earthRadius = 6371000 // meters
        const orbitAltitude = 1000000 // 1000 km altitude
        const orbitRadius = earthRadius + orbitAltitude

        for (let i = 0; i <= steps; i++) {
            const time = (i / steps) * duration
            const angle = (i / steps) * 2 * Math.PI
            
            // Create elliptical orbit
            const a = orbitRadius * 1.5 // semi-major axis
            const b = orbitRadius // semi-minor axis
            const e = Math.sqrt(1 - (b * b) / (a * a)) // eccentricity
            
            const r = a * (1 - e * e) / (1 + e * Math.cos(angle))
            const x = r * Math.cos(angle)
            const y = r * Math.sin(angle)
            const z = r * Math.sin(angle * 2) * 0.1 // slight inclination
            
            // Convert Cartesian to geodetic
            const cartesian = new Cesium.Cartesian3(x, y, z)
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
            const lon = Cesium.Math.toDegrees(cartographic.longitude)
            const lat = Cesium.Math.toDegrees(cartographic.latitude)
            const alt = r - earthRadius

            positions.push(time, lon, lat, alt)
        }

        return positions
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
                        const scale = calculateScale(asteroidSize)
                        entity.model = new Cesium.ModelGraphics({
                            uri: asteroidModel.path,
                            minimumPixelSize: 64,
                            maximumScale: 50000,
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
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Upload CZML File</Label>
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

                    {/* Sample Trajectory */}
                    <Button
                        onClick={createSampleTrajectory}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        Generate Sample Trajectory
                    </Button>

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
