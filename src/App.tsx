import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [featureCount, setFeatureCount] = useState(0)
  const [showWMS, setShowWMS] = useState(true)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map
    const map = L.map(mapRef.current, {
      center: [51.5, 10.0],
      zoom: 8,
    })
    mapInstanceRef.current = map

    // Base layer - OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // WMS layer - NRW orthophoto
    const wmsLayer = L.tileLayer.wms(
      'https://www.wms.nrw.de/geobasis/wms_nw_dop?',
      {
        layers: 'nw_dop_rgb',
        format: 'image/jpeg',
        transparent: true,
        attribution: '© Land NRW 2024',
        maxZoom: 22,
      }
    )
    wmsLayer.addTo(map)

    // Cleanup
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  const handleToggleWMS = () => {
    if (mapInstanceRef.current) {
      const layers = (mapInstanceRef.current as any)._layers
      Object.values(layers).forEach((layer: any) => {
        if (layer instanceof L.TileLayer.WMS) {
          if (mapInstanceRef.current!.hasLayer(layer)) {
            mapInstanceRef.current!.removeLayer(layer)
            setShowWMS(false)
          } else {
            mapInstanceRef.current!.addLayer(layer)
            setShowWMS(true)
          }
        }
      })
    }
  }

  const handleExportGeoJSON = () => {
    const data = {
      type: 'FeatureCollection',
      features: [],
    }
    const geojsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([geojsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aoi-${Date.now()}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-2xl font-bold">🛰️ AOI Creation Map</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">
              Controls
            </h2>
            <button
              onClick={handleToggleWMS}
              className="w-full mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              {showWMS ? '🛰️ Hide Satellite' : '🛰️ Show Satellite'}
            </button>
            <button
              onClick={handleExportGeoJSON}
              className="w-full mb-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              📥 Export GeoJSON
            </button>
          </div>

          <div className="bg-gray-100 p-3 rounded mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Statistics</h3>
            <p className="text-sm text-gray-600">
              Features: <span className="font-bold text-gray-900">{featureCount}</span>
            </p>
          </div>

          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
            <strong>How to use:</strong>
            <ol className="mt-2 space-y-1">
              <li>1. View the map</li>
              <li>2. Toggle satellite view</li>
              <li>3. Export GeoJSON when ready</li>
            </ol>
          </div>
        </aside>

        <main className="flex-1 bg-gray-50" ref={mapRef}></main>
      </div>
    </div>
  )
}

export default App
