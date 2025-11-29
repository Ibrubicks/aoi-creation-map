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

interface DrawLayer extends L.Layer {
  toGeoJSON(): any;
}

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const layersRef = useRef<{ satellite: L.TileLayer; normal: L.TileLayer } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [features, setFeatures] = useState<Feature[]>(() => {
    try {
      const stored = localStorage.getItem('aoiFeatures');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'normal'>('satellite');
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Persist features
  useEffect(() => {
    localStorage.setItem('aoiFeatures', JSON.stringify(features));
  }, [features]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = L.map(mapContainer.current).setView([51.225, 6.776], 10);
      mapRef.current = map;

      // Satellite layer (WMS)
      const satelliteLayer = L.tileLayer.wms(
        'https://www.wms.nrw.de/geobasis/wms_nw_dop',
        {
          layers: 'nw_dop_rgb',
          format: 'image/png',
          transparent: false,
          maxZoom: 20,
          minZoom: 5,
          attribution: '© Land NRW',
        }
      );

      // Normal layer (OSM)
      const normalLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }
      );

      layersRef.current = { satellite: satelliteLayer, normal: normalLayer };
      satelliteLayer.addTo(map);

      // FeatureGroup for drawing
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Leaflet.draw configuration
      const drawControl = new (L.Control as any).Draw({
        edit: {
          featureGroup: drawnItems,
          poly: { allowIntersection: true },
        },
        draw: {
          polygon: { 
            allowIntersection: true, 
            showArea: true,
            shapeOptions: {
              color: '#2196F3',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            }
          },
          polyline: { 
            metric: true,
            shapeOptions: {
              color: '#FF9800',
              weight: 3,
              opacity: 0.8,
            }
          },
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
      });
      map.addControl(drawControl);

      // Detect drawing mode
      map.on('draw:drawstart', function (e: any) {
        const drawType = e.layerType;
        setDrawingMode(drawType);
        console.log('Started drawing:', drawType);
      });

      map.on('draw:drawstop', function () {
        setDrawingMode(null);
        console.log('Stopped drawing');
      });

      // Draw created
      map.on('draw:created', function (e: any) {
        const layer = e.layer as DrawLayer;
        drawnItems.addLayer(layer);
        const featureGeo = layer.toGeoJSON();
        const type = featureGeo.geometry.type;

        const newFeature: Feature = {
          id: `${Date.now()}-${Math.random()}`,
          type,
          area: type === 'Polygon' ? 'Polygon Area' : 'Polyline Route',
          geoJson: featureGeo,
        };

        setFeatures((prev) => [...prev, newFeature]);
        setDrawingMode(null);
        console.log('Feature created:', type, featureGeo);
      });

      // Draw edited
      map.on('draw:edited', function (e: any) {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          console.log('Feature edited:', layer.toGeoJSON());
        });
      });

      // Draw deleted
      map.on('draw:deleted', function (e: any) {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          const geo = layer.toGeoJSON();
          setFeatures((prev) =>
            prev.filter((f) => JSON.stringify(f.geoJson) !== JSON.stringify(geo))
          );
        });
      });

      // Restore features
      features.forEach((feature) => {
        try {
          const layer = L.geoJSON(feature.geoJson);
          drawnItems.addLayer(layer);
        } catch (err) {
          console.error('Failed to restore feature:', err);
        }
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.error('Map failed:', error);
    }
  }, []);

  // Handle place search with Enter key
  const handleSearchPlace = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    
    const query = searchTerm.trim();
    if (!query) return;

    setSearchLoading(true);
    try {
      // Using Nominatim API (OpenStreetMap's free geocoding)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      setSearchResults(results);
      
      if (results.length > 0) {
        // Center map on first result
        const { lat, lon } = results[0];
        mapRef.current?.setView([parseFloat(lat), parseFloat(lon)], 12);
      }
    } catch (error) {
      console.error('Place search failed:', error);
      alert('❌ Place search failed. Try another location.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle clicking on a search result
  const handleSelectResult = (result: any) => {
    const { lat, lon, display_name } = result;
    mapRef.current?.setView([parseFloat(lat), parseFloat(lon)], 13);
    setSearchResults([]);
    setSearchTerm(display_name);
  };

  // Handle map layer toggle
  const toggleMapMode = (mode: 'satellite' | 'normal') => {
    if (!mapRef.current || !layersRef.current) return;

    if (mode === 'satellite') {
      mapRef.current.removeLayer(layersRef.current.normal);
      mapRef.current.addLayer(layersRef.current.satellite);
      setMapMode('satellite');
    } else {
      mapRef.current.removeLayer(layersRef.current.satellite);
      mapRef.current.addLayer(layersRef.current.normal);
      setMapMode('normal');
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const geoJSON = JSON.parse(content);

        if (!drawnItemsRef.current || !mapRef.current) return;

        // Add GeoJSON to map
        const layer = L.geoJSON(geoJSON);
        drawnItemsRef.current.addLayer(layer);

        // Extract features
        if (geoJSON.features) {
          const newFeatures: Feature[] = geoJSON.features.map(
            (feat: any, idx: number) => ({
              id: `uploaded-${Date.now()}-${idx}`,
              type: feat.geometry.type,
              area:
                feat.geometry.type === 'Polygon'
                  ? 'Polygon Area'
                  : 'Polyline Route',
              geoJson: feat,
            })
          );
          setFeatures((prev) => [...prev, ...newFeatures]);
        } else if (geoJSON.geometry) {
          const feature: Feature = {
            id: `uploaded-${Date.now()}`,
            type: geoJSON.geometry.type,
            area:
              geoJSON.geometry.type === 'Polygon'
                ? 'Polygon Area'
                : 'Polyline Route',
            geoJson: geoJSON,
          };
          setFeatures((prev) => [...prev, feature]);
        }

        // Fit bounds
        if (layer.getBounds && layer.getBounds().isValid()) {
          mapRef.current.fitBounds(layer.getBounds());
        }

        alert('✅ File uploaded successfully!');
      } catch (error) {
        console.error('Upload failed:', error);
        alert('❌ Failed to upload file. Ensure it\'s valid GeoJSON.');
      }
    };

    reader.readAsText(file);
  };

  const handleExport = () => {
    try {
      const geoJSON = {
        type: 'FeatureCollection',
        features: features.map((f) => f.geoJson),
      };
      const dataStr = JSON.stringify(geoJSON, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aoi-${new Date().toISOString().slice(0, 10)}.geojson`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export');
    }
  };

  const handleClear = () => {
    if (confirm('Clear all features?')) {
      setFeatures([]);
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <h1 className="header-title">📍 Define Area of Interest</h1>
      </header>

      {/* MAIN CONTENT */}
      <div className="app-content">
        {/* SIDEBAR */}
        <aside className="app-sidebar">
          {/* Intro */}
          <section className="sidebar-section">
            <p className="sidebar-intro">
              Define the area(s) where you will apply your object count &
              detection model
            </p>
          </section>

          {/* Drawing Help */}
          {drawingMode && (
            <section className="sidebar-section drawing-help">
              <h2 className="section-title">🎯 Drawing Instructions:</h2>
              {drawingMode === 'polygon' ? (
                <div className="help-text">
                  <p>✏️ <strong>Polygon Mode Active</strong></p>
                  <ul>
                    <li>Click on the map to add points</li>
                    <li>Add as many points as you want</li>
                    <li>Double-click to finish drawing</li>
                    <li>Or right-click and select "Finish"</li>
                  </ul>
                </div>
              ) : (
                <div className="help-text">
                  <p>📌 <strong>Polyline Mode Active</strong></p>
                  <ul>
                    <li>Click on the map to add points</li>
                    <li>Connect dots to create a line</li>
                    <li>Press <strong>Escape</strong> or double-click to finish</li>
                    <li>Or right-click and select "Finish"</li>
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Search */}
          <section className="sidebar-section">
            <h2 className="section-title">Options:</h2>
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search for a city, town, place... or draw area on map"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchPlace}
                aria-label="Search places"
              />
              {searchLoading && <div className="search-loading">Searching...</div>}
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="search-result-item"
                      onClick={() => handleSelectResult(result)}
                    >
                      <div className="result-name">{result.display_name.split(',')[0]}</div>
                      <div className="result-address">{result.display_name.substring(0, 50)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Uploading a shape file
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".geojson,.json,.shp,.zip"
              style={{ display: 'none' }}
              aria-label="Upload GeoJSON or Shapefile"
            />
          </section>

          {/* Map Mode Toggle */}
          <section className="sidebar-section">
            <h2 className="section-title">Map View:</h2>
            <div className="map-mode-buttons">
              <button
                className={`btn-map-mode ${mapMode === 'satellite' ? 'active' : ''}`}
                onClick={() => toggleMapMode('satellite')}
              >
                🛰️ Satellite
              </button>
              <button
                className={`btn-map-mode ${mapMode === 'normal' ? 'active' : ''}`}
                onClick={() => toggleMapMode('normal')}
              >
                🗺️ Normal
              </button>
            </div>
          </section>

          {/* Tools */}
          <section className="sidebar-section">
            <div className="button-group">
              <button
                className="btn-primary"
                onClick={handleExport}
                disabled={features.length === 0}
              >
                📥 Export to GeoJSON
              </button>
              <button
                className="btn-secondary"
                onClick={handleClear}
                disabled={features.length === 0}
              >
                🗑️ Clear All Features
              </button>
            </div>
          </section>

          {/* Stats */}
          <section className="sidebar-section">
            <h2 className="section-title">Statistics</h2>
            <div className="stats-box">
              <div className="stat-row">
                <span className="stat-label">Total Features:</span>
                <span className="stat-value">{features.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Polygons:</span>
                <span className="stat-value">
                  {features.filter((f) => f.type === 'Polygon').length}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Polylines:</span>
                <span className="stat-value">
                  {features.filter((f) => f.type === 'LineString').length}
                </span>
              </div>
            </div>
          </section>

          {/* Features List */}
          <section className="features-scroll">
            <h2 className="section-title">Features ({filteredFeatures.length})</h2>
            <div className="features-list">
              {filteredFeatures.length > 0 ? (
                filteredFeatures.map((feature, idx) => (
                  <div
                    key={feature.id}
                    className={`feature-item ${
                      selectedFeature === feature.id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedFeature(feature.id)}
                    role="listitem"
                  >
                    <span className="feature-badge">{idx + 1}</span>
                    <div className="feature-details">
                      <span className="feature-type">{feature.type}</span>
                      <span className="feature-area">{feature.area}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-features">
                  {features.length === 0
                    ? '📍 Draw polygons or polylines on the map'
                    : '🔍 No features match search'}
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* MAP */}
        <main
          className="app-map"
          ref={mapContainer}
          role="region"
          aria-label="Interactive map"
        ></main>
      </div>
    </div>
  );
}
