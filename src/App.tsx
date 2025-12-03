import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "./App.css";

/* ICONS — white, crisp, visible */
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const IconLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconGear = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

/* DRAW TOOL ICONS */
const IconPolyline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19L9 12L14 15L20 5"></path>
    <circle cx="4" cy="19" r="2" fill="currentColor" stroke="none"></circle>
    <circle cx="20" cy="5" r="2" fill="currentColor" stroke="none"></circle>
  </svg>
);

const IconPolygon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
    <polygon points="12,3 21,9 18,20 6,20 3,9"></polygon>
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// Area type
interface Area {
  id: number;
  name: string;
  layer: L.Layer;
  visible: boolean;
}

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawHandlerRef = useRef<any>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"normal" | "satellite">("normal");
  const [searchTerm, setSearchTerm] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const areaCounterRef = useRef(0);

  /* MAP INIT */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, { zoomControl: false }).setView([50.94, 6.95], 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("draw:created", (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);

      areaCounterRef.current += 1;
      const newArea: Area = {
        id: areaCounterRef.current,
        name: `Area ${areaCounterRef.current}`,
        layer: layer,
        visible: true,
      };
      setAreas((prev) => [...prev, newArea]);
      setDrawingMode(null);
    });

    map.on("draw:drawstop", () => {
      setDrawingMode(null);
    });
  }, []);

  const startDrawing = (type: "polyline" | "polygon") => {
    if (!mapRef.current || !drawnItemsRef.current) return;
    
    // Cancel any existing drawing
    if (drawHandlerRef.current) {
      drawHandlerRef.current.disable();
    }

    const options = {
      shapeOptions: { color: "#f7b86b", weight: 3 }
    };

    if (type === "polyline") {
      drawHandlerRef.current = new (L.Draw as any).Polyline(mapRef.current, options);
    } else {
      drawHandlerRef.current = new (L.Draw as any).Polygon(mapRef.current, options);
    }
    
    drawHandlerRef.current.enable();
    setDrawingMode(type);
  };

  const toggleEditMode = () => {
    if (!mapRef.current || !drawnItemsRef.current) return;
    
    if (editMode) {
      // Save edits
      setEditMode(false);
    } else {
      setDeleteMode(false);
      setEditMode(true);
      // Enable editing on all layers
      drawnItemsRef.current.eachLayer((layer: any) => {
        if (layer.editing) {
          layer.editing.enable();
        }
      });
    }
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setEditMode(false);
    
    if (drawnItemsRef.current) {
      drawnItemsRef.current.eachLayer((layer: any) => {
        if (layer.editing) {
          layer.editing.disable();
        }
      });
    }
  };

  const toggleMapMode = (mode: "normal" | "satellite") => {
    if (!mapRef.current) return;
    setMapMode(mode);

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current!.removeLayer(layer);
      }
    });

    if (mode === "normal") {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
    } else {
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ).addTo(mapRef.current);
    }
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = searchTerm.trim();
    if (!q || !mapRef.current) return;

    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    );
    const json = await r.json();
    if (json[0]) {
      mapRef.current.setView([parseFloat(json[0].lat), parseFloat(json[0].lon)], 13);
    }
  };

  const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const geo = JSON.parse(ev.target?.result as string);
        const layer = L.geoJSON(geo, {
          style: { color: "#f7b86b", weight: 3 },
        });
        drawnItemsRef.current?.addLayer(layer);
        mapRef.current?.fitBounds(layer.getBounds());

        areaCounterRef.current += 1;
        const newArea: Area = {
          id: areaCounterRef.current,
          name: `Area ${areaCounterRef.current}`,
          layer: layer,
          visible: true,
        };
        setAreas((prev) => [...prev, newArea]);
      } catch {
        alert("Invalid GeoJSON");
      }
    };
    reader.readAsText(file);
  };

  const deleteArea = (areaId: number) => {
    const area = areas.find((a) => a.id === areaId);
    if (area && drawnItemsRef.current) {
      drawnItemsRef.current.removeLayer(area.layer);
    }
    setAreas((prev) => prev.filter((a) => a.id !== areaId));
  };

  const toggleAreaVisibility = (areaId: number) => {
    setAreas((prev) =>
      prev.map((a) => {
        if (a.id === areaId) {
          if (a.visible) {
            drawnItemsRef.current?.removeLayer(a.layer);
          } else {
            drawnItemsRef.current?.addLayer(a.layer);
          }
          return { ...a, visible: !a.visible };
        }
        return a;
      })
    );
  };

  return (
    <div className="app-shell">
      {/* LEFT TOOLBAR */}
      <div className="left-toolbar">
        <button className="icon-btn">
          <IconHome />
        </button>
        <button className="icon-btn">
          <IconGrid />
        </button>
        <button className="icon-btn">
          <IconLayers />
        </button>

        <div className="footer-icons">
          <button className="icon-btn">
            <IconUser />
          </button>
          <button className="icon-btn">
            <IconGear />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="app-sidebar">
        <div className="sidebar-header">
          <div className="header-back">‹</div>
          <div className="header-title">Define Area of Interest</div>
        </div>

        <div className="sidebar-title">Define the area(s)</div>
        <div className="sidebar-subtitle">
          where you will apply your object count & detection model
        </div>

        <div className="section-title">Options:</div>
        <input
          className="search-input"
          type="text"
          placeholder="Search for city, town… or draw area on map"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
        />

        <div className="map-mode-buttons">
          <button
            className={`btn-map ${mapMode === "normal" ? "active" : ""}`}
            onClick={() => toggleMapMode("normal")}
          >
            🗺️ Normal
          </button>
          <button
            className={`btn-map ${mapMode === "satellite" ? "active" : ""}`}
            onClick={() => toggleMapMode("satellite")}
          >
            🛰️ Satellite
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".json,.geojson"
          onChange={uploadFile}
        />
        <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
          📁 Uploading a shape file
        </button>

        {/* AREAS LIST */}
        {areas.length > 0 && (
          <div className="areas-section">
            <div className="section-title">Created Areas:</div>
            <div className="areas-list">
              {areas.map((area) => (
                <div key={area.id} className="area-item">
                  <div className="area-color-box"></div>
                  <span className="area-name">{area.name}</span>
                  <div className="area-actions">
                    <button
                      className="area-action-btn"
                      onClick={() => deleteArea(area.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                    <button
                      className={`area-action-btn ${!area.visible ? "hidden-area" : ""}`}
                      onClick={() => toggleAreaVisibility(area.id)}
                      title={area.visible ? "Hide" : "Show"}
                    >
                      {area.visible ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {drawingMode && (
          <div className="drawing-help">
            <strong>Drawing: {drawingMode}</strong>
            <ul>
              <li>Click to add points</li>
              <li>Double-click to finish</li>
            </ul>
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="app-map" ref={mapContainer}>
        {/* CUSTOM DRAW TOOLBAR */}
        <div className="custom-draw-toolbar">
          <button 
            className={`draw-tool-btn ${drawingMode === 'polyline' ? 'active' : ''}`}
            onClick={() => startDrawing('polyline')}
            title="Draw Polyline"
          >
            <IconPolyline />
          </button>
          <button 
            className={`draw-tool-btn ${drawingMode === 'polygon' ? 'active' : ''}`}
            onClick={() => startDrawing('polygon')}
            title="Draw Polygon"
          >
            <IconPolygon />
          </button>
          <div className="draw-toolbar-divider"></div>
          <button 
            className={`draw-tool-btn ${editMode ? 'active' : ''}`}
            onClick={toggleEditMode}
            title="Edit Layers"
          >
            <IconEdit />
          </button>
          <button 
            className={`draw-tool-btn ${deleteMode ? 'active' : ''}`}
            onClick={toggleDeleteMode}
            title="Delete Layers"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
