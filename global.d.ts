// Minimal global declarations for config files and tools
declare module 'react';
declare module 'react-dom/client';
declare module 'leaflet';
declare module '@playwright/test';
declare module 'vite';
declare module '@vitejs/plugin-react';

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
