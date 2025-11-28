import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import './App.css';

interface Feature {
  id: string;
  type: string;
  area: string;
  geoJson: any;
}

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // 1. Create map
    const map = L.map(mapContainer.current).setView([51.505, -0.09], 13);
    mapRef.current = map;

    // 2. Add OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 3. FeatureGroup to manage drawn layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // 4. Leaflet.draw controls
    // @ts-ignore next-line
    const drawControl = new (L.Control as any).Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        polygon: true,
        polyline: true,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      }
    });
    map.addControl(drawControl);

    // 5. Handle created shapes
    map.on('draw:created', function (e: any) {
      drawnItems.addLayer(e.layer);
      const featureGeo = e.layer.toGeoJSON();
      const area = featureGeo.geometry.type === 'Polygon'
        ? 'Polygon'
        : featureGeo.geometry.type === 'LineString'
        ? 'Line'
        : '';
      setFeatures(old => [
        ...old,
        {
          id: String(Date.now()) + Math.random(),
          type: featureGeo.geometry.type,
          area,
          geoJson: featureGeo,
        }
      ]);
    });

    // 6. Handle deletions/edits
    map.on('draw:deleted', function () {
      const updated: Feature[] = [];
      drawnItems.eachLayer(layer => {
        const geo = (layer as any).toGeoJSON();
        updated.push({
          id: String(+new Date()) + Math.random(),
          type: geo.geometry.type,
          area: '',
          geoJson: geo,
        });
      });
      setFeatures(updated);
    });

    // Clean up
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Export features as GeoJSON ---
  function handleExport() {
    const geo = {
      type: 'FeatureCollection',
      features: features.map(f => f.geoJson),
    };
    const data = JSON.stringify(geo, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'features.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Clear All Button ---
  function handleClear() {
    if (!mapRef.current) return;
    mapRef.current.eachLayer(layer => {
      if ((layer as any).options && (layer as any).options.pane === "overlayPane") {
        mapRef.current?.removeLayer(layer);
      }
    });
    setFeatures([]);
  }

  // --- Filter features for search ---
  const filteredFeatures = features.filter(
    (f) =>
      f.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </section>
          <section className="sidebar-section">
            <h2 className="section-title">Drawing Tools</h2>
            <div className="button-group">
              <button className="btn-secondary" onClick={handleClear}>
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
            </div>
          </section>
          <section className="sidebar-section">
            <button className="btn-apply-outline" disabled>
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
                filteredFeatures.map((f, idx) => (
                  <div key={f.id} className="feature-item">
                    <span className="feature-badge">{idx + 1}</span>
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
        <main className="app-map" ref={mapContainer}></main>
      </div>
    </div>
  );
}
