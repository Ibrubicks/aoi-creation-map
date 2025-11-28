declare module 'leaflet-draw' {
  import * as L from 'leaflet';
  namespace L {
    namespace Draw {
      enum Event {
        CREATED = 'draw:created',
        EDITED = 'draw:edited',
        DELETED = 'draw:deleted',
        DRAWSTART = 'draw:drawstart',
        DRAWSTOP = 'draw:drawstop',
        EDITSTART = 'draw:editstart',
        EDITSTOP = 'draw:editstop',
        DELETESTART = 'draw:deletestart',
        DELETESTOP = 'draw:deletestop'
      }
    }
    namespace Control {
      class Draw extends Control {
        constructor(options?: any);
      }
    }
  }
}

declare module 'leaflet' {
  export namespace GeometryUtil {
    function geodesicArea(latlngs: import('leaflet').LatLng[]): number;
  }
}
