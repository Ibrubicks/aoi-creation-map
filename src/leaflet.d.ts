declare module 'leaflet' {
  export interface FeatureGroup {
    toGeoJSON(): any;
  }
}

declare module 'leaflet-draw' {
  export interface Control {
    Draw: any;
  }
}

declare global {
  namespace L {
    namespace Control {
    }
  }
}

export {};
