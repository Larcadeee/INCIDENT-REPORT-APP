import React, { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import * as topojson from 'topojson-client';

export const ButuanLayer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let mounted = true;

    const loadBoundary = async () => {
      try {
        const response = await fetch('/butuan.json');
        if (!response.ok) {
          console.warn("Failed to load /butuan.json - please upload the file to the public directory.");
          return;
        }
        const topology = await response.json();
        
        // Convert TopoJSON to GeoJSON
        // Assuming the main object is 'Boundary' or something similar based on the user's data
        // The TopoJSON has "objects": {"Boundary": {"type": "GeometryCollection", ...}}
        const geojson = topojson.feature(topology, topology.objects.Boundary);
        
        if (mounted) {
          map.data.addGeoJson(geojson);
          map.data.setStyle({
            fillColor: '#3b82f6', // blue-500
            fillOpacity: 0.1,
            strokeWeight: 2,
            strokeColor: '#2563eb', // blue-600
            strokeOpacity: 0.8
          });

          // Optional: fit bounds to the GeoJSON
          const bounds = new google.maps.LatLngBounds();
          map.data.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
              geometry.forEachLatLng((latLng) => {
                bounds.extend(latLng);
              });
            }
          });
          map.fitBounds(bounds);
        }
      } catch (err) {
        console.error("Error loading Butuan TopoJSON:", err);
      }
    };

    loadBoundary();

    return () => {
      mounted = false;
      // Clean up features
      if (map) {
        map.data.forEach((feature) => {
          map.data.remove(feature);
        });
      }
    };
  }, [map]);

  return null;
};
