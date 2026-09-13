import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { IncidentReport } from '../../types/disaster-system';
import { useAuth } from '../../context/AuthContext';
import { animate, stagger } from 'animejs';

export const SupervisorValidationQueue: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [pendingIncidents, setPendingIncidents] = useState<IncidentReport[]>([]);
  const listRef = useRef(null);

  useEffect(() => {
    // Realtime snapshot listener scoped strictly to PENDING_REVIEW items
    const q = query(
      collection(db, 'incidents'),
      where('status', '==', 'PENDING_REVIEW')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: IncidentReport[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as IncidentReport) });
      });
      setPendingIncidents(items);
      
      // Animate new items
      if (listRef.current && items.length > 0) {
        animate('.queue-row', {
          translateY: [10, 0],
          opacity: [0, 1],
          delay: stagger(50),
          duration: 400,
          ease: 'outQuad'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (incidentId: string, status: 'VERIFIED' | 'REJECTED', reason = '') => {
    if (!currentUser || (role !== 'SUPERVISOR' && role !== 'ADMIN')) return;
    
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      status,
      reviewedBy: {
        uid: currentUser.uid,
        name: currentUser.displayName || 'Operations Supervisor',
        reviewDate: new Date().toISOString(),
        rejectionReason: reason
      },
      updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-6 shadow-sm max-w-5xl mx-auto flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Validation Queue</h2>
          <p className="text-xs text-gray-500 mt-1">Audit incident accuracy prior to deployment</p>
        </div>
        <span className="bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-1 rounded font-medium uppercase tracking-wider">
          Pending: {pendingIncidents.length}
        </span>
      </div>

      {pendingIncidents.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          NO INCOMING RECORDS AWAIT AUTHORIZATION
        </div>
      ) : (
        <div className="space-y-3" ref={listRef}>
          {pendingIncidents.map((inc) => (
            <div key={inc.id} className="queue-row p-4 border border-gray-100 bg-gray-50 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-blue-600 text-sm font-medium">{inc.incidentNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                    inc.severity === 'CRITICAL' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-orange-50 border border-orange-200 text-orange-700'
                  }`}>{inc.severity}</span>
                  <span className="text-xs text-gray-500">| {inc.category} - {inc.subType}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">{inc.location.barangay} - {inc.location.address}</p>
                <p className="text-sm text-gray-600 italic">"{inc.narrative}"</p>
                <div className="text-xs text-gray-500 space-x-4 pt-2 uppercase">
                  <span>Families: <strong className="text-gray-700">{inc.impact.affectedFamilies}</strong></span>
                  <span>Casualties: <strong className="text-gray-700">{inc.impact.casualties.dead} dead, {inc.impact.casualties.injured} inj</strong></span>
                  <span>Encoder: <strong className="text-gray-700">{inc.encodedBy.name}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => inc.id && handleAction(inc.id, 'VERIFIED')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Verify
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Specify operational reason for rejection:');
                    if (reason && inc.id) handleAction(inc.id, 'REJECTED', reason);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
