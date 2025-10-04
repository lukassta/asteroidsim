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

const AsteroidControlPanel = ({ onLaunch }) => {
    const [diameter, setDiameter] = useState(100) // meters
    const [density, setDensity] = useState(3000) // kg/m³ default: rock
    const [velocity, setVelocity] = useState(20000) // m/s
    const [entryAngle, setEntryAngle] = useState(45) // degrees
    const [azimuth, setAzimuth] = useState(0) // degrees
    const [lat, setLat] = useState(0) // aim point latitude
    const [lon, setLon] = useState(0) // aim point longitude

    const handleLaunch = () => {
        onLaunch({
            diameter,
            density,
            velocityKm: velocity / 1000, // convert to km/s for backend
            entryAngle,
            azimuth,
            aimPoint: { lat, lon },
        })
    }

    return (
        <div className="fixed top-0 right-0 h-screen w-1/4 bg-slate-800/95 backdrop-blur-md border-l border-slate-700/50 shadow-2xl z-10 flex flex-col">
            <Card className="flex-1 bg-transparent border-0 shadow-none">
                <CardHeader>
                    <CardTitle className="text-slate-100 text-lg">Asteroid Parameters</CardTitle>
                    <CardDescription className="text-slate-400">
                        Define the impact scenario
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 text-slate-200 overflow-y-auto">
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
                            />
                            <Input
                                type="number"
                                value={diameter}
                                onChange={(e) => setDiameter(Number(e.target.value))}
                                className="w-20 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>

                    {/* Density */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Material Density (kg/m³)</Label>
                        <Select value={density.toString()} onValueChange={(val) => setDensity(Number(val))}>
                            <SelectTrigger className="w-full bg-slate-900 text-slate-200 border-slate-600">
                                <SelectValue placeholder="Select density" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3000">Rock (~3000)</SelectItem>
                                <SelectItem value="2500">Crystal (~2500)</SelectItem>
                                <SelectItem value="7800">Iron (~7800)</SelectItem>
                                <SelectItem value="1000">Ice (~1000)</SelectItem>
                            </SelectContent>
                        </Select>
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
                            />
                            <Input
                                type="number"
                                value={velocity}
                                onChange={(e) => setVelocity(Number(e.target.value))}
                                className="w-24 bg-slate-900 text-slate-200 border-slate-600 
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <p className="text-xs text-slate-400">Will be converted to km/s for backend</p>
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
                        <p className="text-xs text-slate-400">
                            Spawn point will be placed 120 km above aim point
                        </p>
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
