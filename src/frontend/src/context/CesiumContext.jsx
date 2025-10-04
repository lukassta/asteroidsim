import { createContext, useContext, useState, useRef } from 'react'

const CesiumContext = createContext(null)

export function CesiumProvider({ children }) {
  const [viewer, setViewer] = useState(null)
  const entitiesRef = useRef([])

  const value = {
    viewer,
    setViewer,
    entitiesRef,
  }

  return (
    <CesiumContext.Provider value={value}>
      {children}
    </CesiumContext.Provider>
  )
}

export function useCesium() {
  const context = useContext(CesiumContext)
  if (!context) {
    throw new Error('useCesium must be used within CesiumProvider')
  }
  return context
}