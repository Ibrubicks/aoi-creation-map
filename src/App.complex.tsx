import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import './App.css'

interface Feature {
  type: string
  id: string
  area?: number
}

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  const drawControlRef = useRef<L.Control.Draw | null>(null)
  const wmsLayerRef = useRef<L.TileLayer.WMS | null>(null)

  const [features, setFeatures] = useState<Feature[]>([])
  const [featureCount, setFeatureCount] = useState(0)
  const [totalArea, setTotalArea] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [satelliteVisible, setSatelliteVisible] = useState(true)

  // Load features from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('aoi-features')
    if (stored) {
      try {
        const geojson = JSON.parse(stored)
        const loadedFeatures = geojson.features?.map((f: any, i: number) => ({
          type: f.geometry.type,
          id: `feature-${i}`,
        })) || []
        setFeatures(loadedFeatures)
      } catch (error) {
        console.error('Error loading features:', error)
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current, {
      center: [51.5, 10.0],
      zoom: 8,
      preferCanvas: true,
    })

    mapInstanceRef.current = map

    // Base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.7,
    }).addTo(map)

    // WMS layer
    const wmsLayer = L.tileLayer.wms(
      'https://www.wms.nrw.de/geobasis/wms_nw_dop?',
      {
        layers: 'nw_dop_rgb',
        format: 'image/jpeg',
        transparent: true,
        attribution: '© Land NRW 2024',
        maxZoom: 22,
        opacity: 0.8,
      }
    )
    wmsLayer.addTo(map)
    wmsLayerRef.current = wmsLayer

    // Drawn items
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems

    // Draw control
    const drawControl = new (L.Control as any).Draw({
      position: 'topleft',
      draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: false,
        marker: true,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    })
    map.addControl(drawControl)
    drawControlRef.current = drawControl

    // Draw event handlers
    map.on('draw:created', (e: any) => {
      const layer = e.layer
      drawnItems.addLayer(layer)
      saveFeatures()
      updateStats()
    })

    map.on('draw:edited', () => {
      saveFeatures()
      updateStats()
    })

    map.on('draw:deleted', () => {
      saveFeatures()
      updateStats()
    })

    // Geocoder removed - not needed

    // Restore features
    const stored = localStorage.getItem('aoi-features')
    if (stored) {
      try {
        const geojson = JSON.parse(stored)
        if (geojson.features) {
          L.geoJSON(geojson, {
            onEachFeature: (feature: any, layer: any) => {
              drawnItems.addLayer(layer)
            },
          })
        }
      } catch (error) {
        console.error('Error restoring features:', error)
      }
    }

    updateStats()

    return () => {
      map.remove()
    }
  }, [])

  const saveFeatures = useCallback(() => {
    if (!drawnItemsRef.current) return
    const geojson = drawnItemsRef.current.toGeoJSON()
    localStorage.setItem('aoi-features', JSON.stringify(geojson))
  }, [])

  const geodesicArea = (latLngs: L.LatLng[]): number => {
    const R = 6371000 // Earth's radius
    let area = 0
    for (let i = 0; i < latLngs.length - 1; i++) {
      const p1 = latLngs[i]
      const p2 = latLngs[i + 1]
      const φ1 = (p1.lat * Math.PI) / 180
      const φ2 = (p2.lat * Math.PI) / 180
      const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180

      area += Math.abs(
        ((2 *
          Math.atan2(
            Math.tan(φ2 / 2) * Math.sin(Δλ),
            1 + Math.tan(φ2 / 2) * Math.tan(φ1 / 2) * Math.cos(Δλ)
          )) *
          R *
          R) /
          2
      )
    }
    return area
  }

  const calculateTotalArea = useCallback(() => {
    if (!drawnItemsRef.current) return 0
    let area = 0
    drawnItemsRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon && !(layer instanceof L.Marker)) {
        const latLngs = layer.getLatLngs() as L.LatLng[][] | L.LatLng[]
        const ring = Array.isArray(latLngs[0]) ? (latLngs[0] as L.LatLng[]) : (latLngs as L.LatLng[])
        area += geodesicArea(ring)
      }
    })
    return area / 1000000 // km²
  }, [])

  const updateStats = useCallback(() => {
    if (!drawnItemsRef.current) return
    const count = drawnItemsRef.current.getLayers().length
    const area = calculateTotalArea()

    setFeatureCount(count)
    setTotalArea(area)

    const updatedFeatures: Feature[] = []
    let index = 0
    drawnItemsRef.current.eachLayer((layer: any) => {
      const type = layer instanceof L.Polygon && !(layer instanceof L.Marker)
        ? 'Polygon'
        : layer instanceof L.Polyline && !(layer instanceof L.Polygon)
          ? 'Line'
          : 'Marker'
      updatedFeatures.push({
        type,
        id: `feature-${index}`,
        area: type === 'Polygon' ? geodesicArea(layer.getLatLngs()[0]) / 1000000 : undefined,
      })
      index++
    })
    setFeatures(updatedFeatures)
  }, [calculateTotalArea])

  const handleToggleSatellite = useCallback(() => {
    if (!mapInstanceRef.current || !wmsLayerRef.current) return

    if (mapInstanceRef.current.hasLayer(wmsLayerRef.current)) {
      mapInstanceRef.current.removeLayer(wmsLayerRef.current)
      setSatelliteVisible(false)
    } else {
      mapInstanceRef.current.addLayer(wmsLayerRef.current)
      setSatelliteVisible(true)
    }
  }, [])

  const handleClearAll = useCallback(() => {
    if (!drawnItemsRef.current) return
    if (confirm('Clear all features? This cannot be undone.')) {
      drawnItemsRef.current.clearLayers()
      saveFeatures()
      updateStats()
    }
  }, [saveFeatures, updateStats])

  const handleExportGeoJSON = useCallback(() => {
    if (!drawnItemsRef.current) return
    const geojson = drawnItemsRef.current.toGeoJSON()
    const data = JSON.stringify(geojson, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aoi-features-${new Date().toISOString().split('T')[0]}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">🛰️ AOI Creation Map</h1>
        <p className="text-sm text-gray-600">Satellite Imagery - Area of Interest Drawing</p>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 overflow-y-auto border-r border-gray-200 bg-white shadow-sm">
          {/* Search */}
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
              🔍 Search Location
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search address..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Search location"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
              🎨 Map Controls
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleToggleSatellite}
                className="w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-pressed={satelliteVisible}
              >
                {satelliteVisible ? '🛰️ Hide Satellite' : '🛰️ Show Satellite'}
              </button>
              <button
                onClick={handleExportGeoJSON}
                className="w-full rounded bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                📥 Export GeoJSON
              </button>
              <button
                onClick={handleClearAll}
                className="w-full rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
              📊 Statistics
            </h2>
            <div className="space-y-2 rounded bg-gray-100 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Features:</span>
                <span className="font-bold text-gray-900">{featureCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Total Area:</span>
                <span className="font-bold text-gray-900">{totalArea.toFixed(2)} km²</span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="flex-1 border-b border-gray-200 p-4 overflow-y-auto">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
              📍 Features
            </h2>
            {features.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <div className="text-3xl mb-2">📌</div>
                <p className="text-sm">No features yet</p>
                <p className="text-xs text-gray-400 mt-1">Use drawing tools on the map</p>
              </div>
            ) : (
              <div className="space-y-2">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center gap-2 rounded bg-gray-100 p-2 text-sm"
                  >
                    <span className="text-blue-500">●</span>
                    <span className="font-medium text-gray-700">{feature.type}</span>
                    {feature.area && (
                      <span className="ml-auto text-xs text-gray-600">
                        {feature.area.toFixed(2)} km²
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="border-t border-gray-200 p-4">
            <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-3 text-xs text-gray-700">
              <strong>How to use:</strong>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Click drawing tools (left of map)</li>
                <li>Draw on the map</li>
                <li>Export as GeoJSON</li>
                <li>Auto-saved locally</li>
              </ol>
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 overflow-hidden">
          <div ref={mapRef} className="h-full w-full" id="map" />
        </main>
      </div>
    </div>
  )
}

export default App