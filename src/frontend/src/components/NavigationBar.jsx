import React from 'react';
import logo from '../assets/asteroidsim.svg';

const NavigationBar = () => {
  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-sm"
      style={{ borderRadius: 0 }}
    >
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Asteroid Simulator" className="h-8" />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="#home" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Home
            </a>
            <a 
              href="#simulation" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Simulation
            </a>
            <a 
              href="#data" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
            >
              Data
            </a>
            <a 
              href="#about" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
            >
              About
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
