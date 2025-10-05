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
    const { viewer } = useCesium()
    const [isPlaying, setIsPlaying] = useState(false)
    const [czmlData, setCzmlData] = useState(null)
    const [selectedAsteroid, setSelectedAsteroid] = useState('bennu')
    const [czmlSource, setCzmlSource] = useState(null)
    const [asteroidSize, setAsteroidSize] = useState(500) // Size in meters
    const [cartesianInput, setCartesianInput] = useState('[0, 0, 0, 100000]') // Cartographic degrees input (time, lon, lat, alt)
    const fileInputRef = useRef(null)

    // Configure viewer when component mounts
    useEffect(() => {
        if (!viewer) return

        // Show the globe
        viewer.scene.globe.show = true
        
        // Show the atmosphere (blue sky)
        viewer.scene.skyAtmosphere.show = true

        // Show the skybox
        viewer.scene.skyBox.show = true

        // Remove any existing entities
        viewer.entities.removeAll()

        // Release the camera from lookAt mode
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)

        // Enable necessary viewer features for asteroid simulation
        viewer.scene.globe.enableLighting = true
        viewer.scene.globe.atmosphereLightIntensity = 20.0

        // Show animation and timeline controls
        if (viewer.animation) {
            viewer.animation.container.style.visibility = 'visible'
        }
        if (viewer.timeline) {
            viewer.timeline.container.style.visibility = 'visible'
        }

        // Set camera view for Earth observation
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 25000000),
            orientation: {
                heading: 0.0,
                pitch: -Cesium.Math.PI_OVER_TWO,
                roll: 0.0
            }
        })

        // Cleanup on unmount - hide controls
        return () => {
            if (viewer && !viewer.isDestroyed()) {
                if (viewer.animation) {
                    viewer.animation.container.style.visibility = 'hidden'
                }
                if (viewer.timeline) {
                    viewer.timeline.container.style.visibility = 'hidden'
                }
                // Remove all data sources
                viewer.dataSources.removeAll()
            }
        }
    }, [viewer])

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



    // Load CZML data
    const loadCzmlData = async (czmlJson) => {
        if (!viewer) return

        try {
            // Remove existing CZML data source if any
            if (czmlSource) {
                viewer.dataSources.remove(czmlSource)
            }

            // Load new CZML data
            const dataSource = await Cesium.CzmlDataSource.load(czmlJson)
            await viewer.dataSources.add(dataSource)
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
                    viewer.trackedEntity = entity
                }
            }

            // Start animation
            viewer.clock.shouldAnimate = true
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
                alert('Invalid format. Please provide a valid array like [0, 0, 0, 100000] (time, longitude, latitude, altitude)')
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
                        cartographicDegrees: cartesianArray
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
        if (!viewer) return
        
        const shouldAnimate = !viewer.clock.shouldAnimate
        viewer.clock.shouldAnimate = shouldAnimate
        setIsPlaying(shouldAnimate)
    }

    const resetSimulation = () => {
        if (!viewer || !czmlData) return
        
        viewer.clock.currentTime = viewer.clock.startTime.clone()
        viewer.clock.shouldAnimate = false
        setIsPlaying(false)
    }

    // Update asteroid model when selection or size changes
    useEffect(() => {
        if (czmlSource && viewer) {
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
    }, [selectedAsteroid, asteroidSize, czmlSource, viewer])

    return (
        <div className="relative w-full h-screen pointer-events-none">
            {/* Control Panel */}
            <Card className="absolute top-20 left-4 w-80 bg-slate-900/95 backdrop-blur-sm border-slate-700 text-slate-100 z-10 pointer-events-auto">
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

                    {/* Cartographic Degrees Input */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Cartographic Degrees</Label>
                        <Input
                            type="text"
                            value={cartesianInput}
                            onChange={(e) => setCartesianInput(e.target.value)}
                            placeholder="[0, 0, 0, 100000]"
                            className="bg-slate-800 border-slate-600 text-slate-100 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-400">
                            Enter array format: [time, longitude, latitude, altitude, ...]
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
