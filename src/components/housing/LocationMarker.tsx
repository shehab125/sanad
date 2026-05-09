import React, { useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

interface LocationMarkerProps {
  position: [number, number] | null;
  setPosition: (p: [number, number] | null) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position, setPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
    };
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, setPosition]);

  return position ? <Marker position={position} /> : null;
};

export default LocationMarker;
