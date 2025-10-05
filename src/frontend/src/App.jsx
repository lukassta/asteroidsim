import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CesiumViewer from './CesiumViewer.jsx'
import { CesiumProvider } from './context/CesiumContext'
import NavigationBar from './components/NavigationBar.jsx'
import HomePage from './pages/HomePage.jsx'
import AsteroidSelectPage from './pages/AsteroidSelectPage.jsx'
import AsteroidSimulationPage from './pages/AsteroidSimulationPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ImpactEffectPage from './pages/ImpactEffectPage.jsx'
import SolarCenteredSimulation from './pages/SolarCenteredSimulation.jsx'

function App() {

  return (
    <BrowserRouter>
      <CesiumProvider>
        <CesiumViewer />
        <NavigationBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/asteroid-select" element={<AsteroidSelectPage />} />
          <Route path="/asteroid-simulation" element={<AsteroidSimulationPage />} />
          <Route path="/impact-effects" element={<ImpactEffectPage />} />
          <Route path="/solar-system" element={<SolarCenteredSimulation />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </CesiumProvider>
    </BrowserRouter>
  )
}

export default App
