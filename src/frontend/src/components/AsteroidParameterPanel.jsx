import React, { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const preMadeAsteroids = [
    { name: 'Apophis', diameter: 370, density: 3000, velocity: 30000 },
    { name: 'Bennu', diameter: 492, density: 1200, velocity: 28000 },
    { name: 'Ryugu', diameter: 900, density: 1900, velocity: 25000 },
    { name: 'Custom' },
]

const structureOptions = [
    { label: 'Water-based rock', value: 'water-based' },
    { label: 'Sedimentary rock', value: 'sedimentary' },
    { label: 'Crystalline rock', value: 'crystalline' }
]

const AsteroidControlPanel = ({ onLaunch }) => {
    const [selectedAsteroid, setSelectedAsteroid] = useState('Apophis')
    const [diameter, setDiameter] = useState(100)
    const [density, setDensity] = useState(3000)
    const [velocity, setVelocity] = useState(20000)
    const [structure, setStructure] = useState('sedimentary')
    const [entryAngle, setEntryAngle] = useState(90)
    const [azimuth, setAzimuth] = useState(0)
    const [lat, setLat] = useState(0)
    const [lon, setLon] = useState(0)

    // Update parameters when a pre-made asteroid is selected
    const handleAsteroidSelect = (name) => {
        setSelectedAsteroid(name)
        const asteroid = preMadeAsteroids.find((a) => a.name === name)
        if (asteroid && asteroid.name !== 'Custom') {
            setDiameter(asteroid.diameter)
            setDensity(asteroid.density)
            setVelocity(asteroid.velocity)
        }
    }

    const isCustom = selectedAsteroid === 'Custom'

    const handleLaunch = () => {
        onLaunch({
            diameter,
            density,
            velocityKm: velocity / 1000.0,
            entryAngle,
            azimuth,
            aimPoint: { lat, lon },
            materialType: structure,
        })
    }

    return (
        <div className="fixed top-16 right-0 h-screen w-1/4 bg-slate-800/95 backdrop-blur-md border-l border-slate-700/50 shadow-2xl z-10 flex flex-col">
            <Card className="flex-1 bg-transparent border-0 shadow-none">
                <CardHeader>
                    <CardTitle className="text-slate-100 text-lg">Asteroid Parameters</CardTitle>
                    <CardDescription className="text-slate-400">
                        Define the impact scenario
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 text-slate-200 overflow-y-auto">
                    {/* Asteroid Selector */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Select Asteroid</Label>
                        <Select value={selectedAsteroid} onValueChange={handleAsteroidSelect}>
                            <SelectTrigger className="w-full bg-slate-900 text-slate-200 border-slate-600">
                                <SelectValue placeholder="Select an asteroid" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 text-slate-200 border-slate-600 z-[100]" sideOffset={5}>
                                {preMadeAsteroids.map((a) => (
                                    <SelectItem key={a.name} value={a.name}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Diameter */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Asteroid Diameter (m)</Label>
                        <div className="flex items-center space-x-2">
                            <Slider
                                value={[diameter]}
                                min={10}
                                max={1000}
                                step={10}
                                onValueChange={(val) => setDiameter(val[0])}
                                className="flex-1"
                                disabled={!isCustom}
                            />
                            <Input
                                type="number"
                                value={diameter}
                                onChange={(e) => setDiameter(Number(e.target.value))}
                                disabled={!isCustom}
                                className="w-20 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    {/* Density */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Material Density (kg/m³)</Label>
                        <div className="flex items-center space-x-2">
                            <Slider
                                value={[density]}
                                min={500}
                                max={8000}
                                step={100}
                                onValueChange={(val) => setDensity(val[0])}
                                className="flex-1"
                                disabled={!isCustom}
                            />
                            <Input
                                type="number"
                                value={density}
                                onChange={(e) => setDensity(Number(e.target.value))}
                                disabled={!isCustom}
                                className="w-24 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    {/* Velocity */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Velocity Before Entry (m/s)</Label>
                        <div className="flex items-center space-x-2">
                            <Slider
                                value={[velocity]}
                                min={11000}
                                max={72000}
                                step={100}
                                onValueChange={(val) => setVelocity(val[0])}
                                className="flex-1"
                                disabled={!isCustom}
                            />
                            <Input
                                type="number"
                                value={velocity}
                                onChange={(e) => setVelocity(Number(e.target.value))}
                                disabled={!isCustom}
                                className="w-24 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    {/* Structure Type */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Structure Type</Label>
                        <Select
                            value={structure}
                            onValueChange={setStructure}
                        >
                            <SelectTrigger className="w-full bg-slate-900 text-slate-200 border-slate-600">
                                <SelectValue placeholder="Select structure type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 text-slate-200 border-slate-600 z-[100]" sideOffset={5}>
                                {structureOptions.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Entry Angle */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Entry Angle (° Horizontal)</Label>
                        <Slider
                            value={[entryAngle]}
                            min={0}
                            max={90}
                            step={1}
                            onValueChange={(val) => setEntryAngle(val[0])}
                        />
                        <p className="text-sm">{entryAngle}°</p>
                    </div>

                    {/* Azimuth */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Entry Angle (° Azimuth)</Label>
                        <Slider
                            value={[azimuth]}
                            min={-90}
                            max={90}
                            step={1}
                            onValueChange={(val) => setAzimuth(val[0])}
                        />
                        <p className="text-sm">{azimuth}°</p>
                    </div>

                    {/* Aim Point */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Aim Point (Lat°, Lon°)</Label>
                        <div className="flex space-x-2">
                            <Input
                                type="number"
                                placeholder="Latitude"
                                value={lat}
                                onChange={(e) => setLat(Number(e.target.value))}
                                className="w-1/2 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Input
                                type="number"
                                placeholder="Longitude"
                                value={lon}
                                onChange={(e) => setLon(Number(e.target.value))}
                                className="w-1/2 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-4 border-t border-slate-700/50">
                    <Button className="w-full" onClick={handleLaunch}>
                        Launch Asteroid
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default AsteroidControlPanel
