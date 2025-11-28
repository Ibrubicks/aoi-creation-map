// Ambient declarations to reduce type errors before installing full @types packages
declare module 'react';
declare module 'react-dom/client';
declare module 'leaflet';
declare module '@playwright/test';
declare module 'vite';
declare module '@vitejs/plugin-react';

declare module 'geojson' {
  export interface Feature { [key: string]: any }
  export interface Geometry { [key: string]: any }
  export interface FeatureCollection { [key: string]: any }
}

declare namespace GeoJSON {
  interface Feature { [key: string]: any }
  interface Geometry { [key: string]: any }
  interface FeatureCollection { [key: string]: any }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CI?: string;
      [key: string]: string | undefined;
    }
  }
}

declare var process: { env: NodeJS.ProcessEnv };

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {}
