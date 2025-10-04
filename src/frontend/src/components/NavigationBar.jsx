import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/asteroidsim.svg';
import { useCesium } from '../context/CesiumContext';
import * as Cesium from 'cesium';

const NavigationBar = () => {
    const { viewer } = useCesium();
    const [isAerialView, setIsAerialView] = useState(true);

    const toggleBaseLayer = () => {
        if (!viewer) return;

        const imageryLayers = viewer.imageryLayers;

        // Remove all existing imagery layers
        imageryLayers.removeAll();

        if (isAerialView) {
            // Switch to OpenStreetMap
            imageryLayers.addImageryProvider(
                new Cesium.OpenStreetMapImageryProvider({
                    url: 'https://a.tile.openstreetmap.org/'
                })
            );
            setIsAerialView(false);
        } else {
            // Switch back to Google Maps aerial view
            Cesium.IonImageryProvider.fromAssetId(3830183).then((provider) => {
                imageryLayers.addImageryProvider(provider);
            });
            setIsAerialView(true);
        }
    };

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-sm"
            style={{ borderRadius: 0 }}
        >
            <div className="max-w-full px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-3">
                        <img src={logo} alt="AsteroidSim" className="h-8" />
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `transition-colors duration-200 font-medium cursor-pointer ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                                }`
                            }
                        >
                            Home
                        </NavLink>
                        {/*<NavLink 
              to="/simulation"
              className={({ isActive }) => 
                `transition-colors duration-200 font-medium cursor-pointer ${
                  isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              Simulation
            </NavLink>*/}
                        <NavLink
                            to="/asteroid-select"
                            className={({ isActive }) =>
                                `transition-colors duration-200 font-medium cursor-pointer ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                                }`
                            }
                        >
                            Asteroid select
                        </NavLink>
                        {/*<NavLink 
              to="/about"
              className={({ isActive }) => 
                `transition-colors duration-200 font-medium cursor-pointer ${
                  isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              About
            </NavLink>*/}
                        <button
                            onClick={toggleBaseLayer}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors duration-200"
                            title={isAerialView ? "Switch to OpenStreetMap" : "Switch to Aerial View"}
                        >
                            {isAerialView ? '🗺️ OSM' : '🛰️ Aerial'}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;
