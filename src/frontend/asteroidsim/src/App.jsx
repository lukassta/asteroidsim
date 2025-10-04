import { useState } from 'react'
import './App.css'
import CesiumViewer from './CesiumViewer.jsx'
import { CesiumProvider } from './context/CesiumContext'
import ControlPanel from './components/ControlPanel.jsx'

function App() {

  return (
    <CesiumProvider>
      <CesiumViewer />
      <ControlPanel />
    </CesiumProvider>
  )
}

export default App
