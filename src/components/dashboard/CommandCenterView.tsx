import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { IncidentReport, EarlyWarningAlert } from '../../types/disaster-system';
import { ReportExportService } from '../../services/ReportExportService';
import { animate, stagger } from 'animejs';

export const CommandCenterView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const listRef = useRef(null);

  useEffect(() => {
    // 1. Incidents Realtime Snapshot
    const incQuery = query(
      collection(db, 'incidents'),
      where('status', '==', 'VERIFIED'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    const unsubIncidents = onSnapshot(incQuery, (snap) => {
      const docs: IncidentReport[] = [];
      snap.forEach((d) => docs.push({ id: d.id, ...(d.data() as IncidentReport) }));
      setIncidents(docs);
      
      // Animate new items
      if (listRef.current && docs.length > 0) {
        animate('.incident-row', {
          translateY: [10, 0],
          opacity: [0, 1],
          delay: stagger(50),
          duration: 400,
          ease: 'outQuad'
        });
      }
    });

    // 2. Alerts Ingestion Snapshot
    const alertQuery = query(
      collection(db, 'alerts'),
      where('isActive', '==', true),
      limit(5)
    );
    const unsubAlerts = onSnapshot(alertQuery, (snap) => {
      const docs: EarlyWarningAlert[] = [];
      snap.forEach((d) => docs.push({ id: d.id, ...(d.data() as EarlyWarningAlert) }));
      setAlerts(docs);
    });

    return () => {
      unsubIncidents();
      unsubAlerts();
    };
  }, []);

  // Aggregation Metrics Calculations
  const metrics = incidents.reduce(
    (acc, item) => {
      acc.totalFamilies += item.impact?.affectedFamilies || 0;
      acc.totalDead += item.impact?.casualties?.dead || 0;
      acc.totalInjured += item.impact?.casualties?.injured || 0;
      return acc;
    },
    { totalFamilies: 0, totalDead: 0, totalInjured: 0 }
  );

  return (
    <div className="flex-grow flex flex-col p-8">
      {/* Aggregate Metrics Tiles */}
      <section className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 p-5 rounded flex flex-col justify-between shadow-sm">
          <span className="text-xs uppercase font-medium text-gray-500 tracking-wider">Active Incidents</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-light text-blue-600">{incidents.length}</span>
            <span className="text-xs text-green-600 font-medium">Live</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded flex flex-col justify-between shadow-sm">
          <span className="text-xs uppercase font-medium text-gray-500 tracking-wider">Displaced Families</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-light text-gray-900">{metrics.totalFamilies.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded flex flex-col justify-between shadow-sm">
          <span className="text-xs uppercase font-medium text-gray-500 tracking-wider">Casualties</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-light text-gray-900">{metrics.totalDead}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded flex flex-col justify-between shadow-sm">
          <span className="text-xs uppercase font-medium text-gray-500 tracking-wider">Injured</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-light text-gray-900">{metrics.totalInjured}</span>
          </div>
        </div>
      </section>

      {/* Main Command Split: Live Feed & Advisory Marquee */}
      <main className="flex-grow grid grid-cols-12 gap-6 overflow-hidden min-h-[500px]">
        {/* Early Warning Broadcast Monitor */}
        <aside className="col-span-4 flex flex-col space-y-6 overflow-hidden">
          <div className="flex-grow bg-white border border-gray-200 rounded p-5 flex flex-col shadow-sm">
            <h2 className="text-xs font-semibold uppercase text-gray-900 mb-4 tracking-wider border-b border-gray-100 pb-3 flex justify-between">
              <span>Early Warnings</span>
              <span className="text-red-500 text-[10px]">LIVE</span>
            </h2>
            <div className="space-y-4 overflow-y-auto pr-2">
               {alerts.length === 0 && <div className="text-gray-500 text-sm py-4">No active alerts.</div>}
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-red-50/50 border-l-[3px] border-red-500 p-3 rounded-r">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">{alert.source}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>
                    <div className="h-56 bg-white border border-gray-200 rounded p-5 flex flex-col shadow-sm">
            <h2 className="text-xs font-semibold uppercase text-gray-900 mb-4 tracking-wider">Resource Status</h2>
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between items-center text-xs mb-1">
                   <span className="text-gray-600">Heavy Rescue Units</span>
                   <span className="font-mono text-gray-900">0 / 0</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-blue-500 w-[0%] h-full rounded-full"></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between items-center text-xs mb-1">
                   <span className="text-gray-600">Ambulance Teams</span>
                   <span className="font-mono text-gray-900">0 / 0</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-blue-500 w-[0%] h-full rounded-full"></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between items-center text-xs mb-1">
                   <span className="text-gray-600">Water Tankers</span>
                   <span className="font-mono text-gray-900">0 / 0</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-blue-500 w-[0%] h-full rounded-full"></div>
                 </div>
               </div>
            </div>
          </div>
        </aside>

        {/* Stream of verified events */}
        <div className="col-span-8 flex flex-col space-y-6">
           <div className="flex-grow bg-white border border-gray-200 rounded p-5 flex flex-col shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <div className="w-48 h-48 border border-blue-200 rounded-full flex items-center justify-center">
                   <div className="w-24 h-24 border border-blue-100 rounded-full"></div>
                 </div>
                 <p className="text-xs text-gray-400 mt-6 tracking-widest uppercase">Map tactical overlay active in COP view</p>
              </div>
           </div>

          <div className="h-72 bg-white border border-gray-200 rounded p-5 flex flex-col shadow-sm z-10 relative">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-xs font-semibold uppercase text-gray-900 tracking-wider">Verified Incident Log</h2>
              <button 
                onClick={() => ReportExportService.exportSituationReportPDF(incidents)}
                className="text-xs uppercase font-medium tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
              >
                Export PDF
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 pr-2" ref={listRef}>
              {incidents.length === 0 && <div className="text-gray-500 text-sm py-4">No verified incidents.</div>}
              {incidents.map((incident) => (
                <div key={incident.id} className="incident-row grid grid-cols-12 gap-3 p-3 bg-gray-50 border border-gray-100 rounded hover:bg-gray-100 transition-colors opacity-0">
                  <div className="col-span-2 text-gray-900 font-medium text-sm truncate">{incident.incidentNumber}</div>
                  <div className={`col-span-2 text-xs font-medium uppercase mt-0.5 ${incident.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'}`}>
                    {incident.severity}
                  </div>
                  <div className="col-span-3 text-sm text-gray-700 truncate">{incident.subType}</div>
                  <div className="col-span-3 text-sm text-gray-500 truncate">{incident.narrative}</div>
                  <div className="col-span-2 text-right text-xs text-gray-400 mt-0.5">
                    {incident.createdAt ? new Date(incident.createdAt.toDate ? incident.createdAt.toDate() : incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
