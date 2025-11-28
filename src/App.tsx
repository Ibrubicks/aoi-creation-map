import React, { useState, useRef, useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

interface Feature {
  id: string
  type: string
  area: string
  coordinates: [number, number][]
}

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const drawnItems = useRef<Feature[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<'polygon' | 'line' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = L.map(mapContainer.current).setView([51.505, -0.09], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  const handleDrawPolygon = () => {
    setDrawMode(isDrawing && drawMode === 'polygon' ? null : 'polygon')
    setIsDrawing(!isDrawing)
  }

  const handleDrawLine = () => {
    setDrawMode(isDrawing && drawMode === 'line' ? null : 'line')
    setIsDrawing(!isDrawing)
  }

  const handleClearAll = () => {
    setFeatures([])
    drawnItems.current = []
    setIsDrawing(false)
    setDrawMode(null)
  }

  const handleExport = () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        type: 'Feature',
        geometry: {
          type: drawMode === 'polygon' ? 'Polygon' : 'LineString',
          coordinates: f.coordinates,
        },
        properties: { type: f.type, area: f.area },
      })),
    }
    console.log(JSON.stringify(geoJSON, null, 2))
  }

  const handleApplyOutline = () => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      type: drawMode === 'polygon' ? 'Polygon' : 'Line',
      area: 'Custom Area',
      coordinates: [[51.5, -0.09]],
    }
    setFeatures([...features, newFeature])
  }

  const filteredFeatures = features.filter(
    (f) =>
      f.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.area.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="header-title">📍 AOI Creation Map</h1>
      </header>

      <div className="app-content">
        <aside className="app-sidebar">
          <section className="sidebar-section">
            <p className="sidebar-intro">
              Search or use vector tool to create your region
            </p>
          </section>

          <section className="sidebar-section">
            <h2 className="section-title">Search Area</h2>
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Search areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </section>

          <section className="sidebar-section">
            <h2 className="section-title">Drawing Tools</h2>
            <div className="button-group">
              <button
                className={`btn-primary ${isDrawing && drawMode === 'polygon' ? 'active' : ''}`}
                onClick={handleDrawPolygon}
              >
                ◯ Draw Polygon
              </button>
              <button
                className={`btn-secondary ${isDrawing && drawMode === 'line' ? 'active' : ''}`}
                onClick={handleDrawLine}
              >
                📍 Draw Line
              </button>
              <button className="btn-secondary" onClick={handleClearAll}>
                🗑️ Clear All
              </button>
              <button className="btn-primary" onClick={handleExport}>
                📥 Export GeoJSON
              </button>
            </div>
          </section>

          <section className="sidebar-section">
            <h2 className="section-title">Statistics</h2>
            <div className="stats-box">
              <div className="stat-row">
                <span className="stat-label">Features:</span>
                <span className="stat-value">{features.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Area:</span>
                <span className="stat-value">0.00 km²</span>
              </div>
            </div>
          </section>

          <section className="sidebar-section">
            <button className="btn-apply-outline" onClick={handleApplyOutline}>
              ✓ Apply outline as base image
            </button>
            <p className="help-text">
              You can always edit the shape of the area later
            </p>
          </section>

          <section className="features-scroll">
            <h2 className="section-title">Features</h2>
            <div className="features-list">
              {filteredFeatures.length > 0 ? (
                filteredFeatures.map((f) => (
                  <div key={f.id} className="feature-item">
                    <span className="feature-badge">{filteredFeatures.indexOf(f) + 1}</span>
                    <div className="feature-details">
                      <span className="feature-type">{f.type}</span>
                      <span className="feature-area">{f.area}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-features">No features yet</div>
              )}
            </div>
          </section>
        </aside>

        <main className="app-map" ref={mapContainer} />

        <div className="map-toolbar">
          <button className="toolbar-icon" title="Zoom In">
            ➕
          </button>
          <button className="toolbar-icon" title="Zoom Out">
            ➖
          </button>
          <button className="toolbar-icon" title="Refresh">
            🔄
          </button>
        </div>
      </div>
    </div>
  )
}
