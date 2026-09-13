import React, { useState } from 'react';
import { Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { IncidentReport, ResourceInventory } from '../../types/disaster-system';
import { ButuanLayer } from './ButuanLayer';

interface MapProps {

  incidents: IncidentReport[];
  resources: ResourceInventory[];
  center?: { lat: number; lng: number };
}

export const DisasterMap: React.FC<MapProps> = ({ 
  incidents, 
  resources, 
  center = { lat: 14.5995, lng: 120.9842 } 
}) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-800">
      <Map
        defaultCenter={center}
        defaultZoom={12}
        disableDefaultUI={false}
        mapTypeControl={false}
        className="w-full h-full bg-slate-900"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
      >
        <ButuanLayer />
        {incidents.map((inc) => {
          if (!inc.location.coordinates) return null;
          
          const isCritical = inc.severity === 'CRITICAL';
          
          return (
            <Marker
              key={inc.incidentNumber}
              position={{
                lat: inc.location.coordinates.latitude,
                lng: inc.location.coordinates.longitude
              }}
              title={inc.subType}
              onClick={() => setSelectedIncident(inc)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: isCritical ? '#f43f5e' : '#f59e0b',
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: '#ffffff',
                scale: isCritical ? 10 : 7,
              }}
            />
          );
        })}

        {selectedIncident && selectedIncident.location.coordinates && (
          <InfoWindow
            position={{
              lat: selectedIncident.location.coordinates.latitude,
              lng: selectedIncident.location.coordinates.longitude
            }}
            onCloseClick={() => setSelectedIncident(null)}
          >
            <div style={{ color: 'black', fontFamily: 'sans-serif', padding: '4px' }}>
              <strong>{selectedIncident.incidentNumber}</strong> [{selectedIncident.severity}]<br/>
              <span>Type: {selectedIncident.subType}</span><br/>
              <span>Loc: {selectedIncident.location.barangay}</span><br/>
              <span>Casualties: {selectedIncident.impact.casualties.dead + selectedIncident.impact.casualties.injured}</span>
            </div>
          </InfoWindow>
        )}
      </Map>

      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded text-xs text-white space-y-1">
        <p className="font-bold tracking-wider text-cyan-400 uppercase">Map Overlay Indicator</p>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
          <span>Critical Severity Incident</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span>Moderate / Contained Influx</span>
        </div>
      </div>
    </div>
  );
};
