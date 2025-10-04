import { useState } from 'react'
import './App.css'
import CesiumViewer from './CesiumViewer.jsx'
import { CesiumProvider } from './context/CesiumContext'
import ControlPanel from './components/ControlPanel.jsx'
import InfoCard from './components/InfoCard.jsx'

function App() {

  return (
    <CesiumProvider>
      <CesiumViewer />
      <InfoCard
        title="Asteroid Information"
        description="Details about the selected asteroid"
        content={<div>Your content here</div>}
        footer={<button>Action</button>}
        className="w-full max-w-md"
      />
    </CesiumProvider>
  )
}

export default App
