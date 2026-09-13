import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage, db } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { IncidentCategory, IncidentSeverity } from '../../types/disaster-system';
import { animate } from 'animejs';

export const IncidentEncodingForm: React.FC = () => {
  const { currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef(null);

  useEffect(() => {
    animate(formRef.current, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      ease: 'outQuad'
    });
  }, []);

  // Form States
  const [category, setCategory] = useState<IncidentCategory>('HYDRO_MET');
  const [subType, setSubType] = useState('Flash Flood');
  const [severity, setSeverity] = useState<IncidentSeverity>('MODERATE');
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('14.5995');
  const [lng, setLng] = useState('120.9842');
  const [affectedFamilies, setFamilies] = useState(0);
  const [affectedIndividuals, setIndividuals] = useState(0);
  const [dead, setDead] = useState(0);
  const [injured, setInjured] = useState(0);
  const [missing, setMissing] = useState(0);
  const [narrative, setNarrative] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setError(null);

    try {
      if (!barangay || !category || !subType) {
        throw new Error('Missing mandatory fields');
      }

      // Compute unique window fingerprint (1-hour resolution) for basic client deduplication
      const hourBucket = new Date().toISOString().substring(0, 13);
      const fingerprintString = `${barangay.trim().toLowerCase()}-${subType.trim().toLowerCase()}-${hourBucket}`;
      
      // Simple hash using Web Crypto API
      const msgBuffer = new TextEncoder().encode(fingerprintString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const q = query(
        collection(db, 'incidents'), 
        where('fingerprint', '==', hashHex),
        where('status', 'in', ['PENDING_REVIEW', 'VERIFIED'])
      );
      const duplicateSnap = await getDocs(q);
      
      if (!duplicateSnap.empty) {
        throw new Error('A duplicate incident of this nature was reported within this hour in this area.');
      }

      // 1. Process Uploads
      const mediaAttachments = [];
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const path = `incidents/${Date.now()}_${file.name}`;
          const storageReference = ref(storage, path);
          const snapshot = await uploadBytes(storageReference, file);
          const url = await getDownloadURL(snapshot.ref);
          mediaAttachments.push({
            url,
            storagePath: path,
            fileType: file.type.includes('video') ? ('video' as const) : ('image' as const),
            uploadedBy: currentUser.uid
          });
        }
      }

      // 2. Construct Incident Document
      const payload = {
        incidentNumber: `CDRRMD-${Date.now().toString().slice(-6)}`,
        category,
        subType,
        severity,
        status: 'PENDING_REVIEW',
        reportedAt: new Date().toISOString(),
        fingerprint: hashHex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location: {
          address,
          barangay,
          coordinates: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
          }
        },
        impact: {
          affectedFamilies: Number(affectedFamilies),
          affectedIndividuals: Number(affectedIndividuals),
          displacedInsideEvac: 0,
          displacedOutsideEvac: 0,
          casualties: {
            dead: Number(dead),
            injured: Number(injured),
            missing: Number(missing)
          },
          infrastructureDamageEstimatedPHP: 0
        },
        narrative,
        mediaAttachments,
        encodedBy: {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'Operations Encoder'
        }
      };

      const docRef = await addDoc(collection(db, 'incidents'), payload);

      setSuccessId(docRef.id);
      
      // Reset form
      setNarrative('');
      setFiles(null);
    } catch (err: any) {
      setError(err.message || 'Operation failed. Verify validation parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-6 shadow-sm max-w-4xl mx-auto flex flex-col opacity-0" ref={formRef}>
      <div className="mb-6 border-b border-gray-100 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Encode Incident Report</h2>
      </div>

      {successId && (
        <div className="mb-4 p-3 bg-green-50 border-l-2 border-green-500 rounded-r text-green-700 text-sm font-medium">
          Incident report queued successfully for validation. Reference: {successId}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-2 border-red-500 rounded-r text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="HYDRO_MET">Hydro-Meteorological</option>
              <option value="NATURAL">Geological / Natural</option>
              <option value="MAN_MADE">Man-Made / Technological</option>
              <option value="SEISMIC">Seismic Incident</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Sub-Type</label>
            <input
              type="text"
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-3">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Barangay</label>
              <input
                type="text"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Lat</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Lng</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-3">Impact</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Families</label>
              <input
                type="number"
                value={affectedFamilies}
                onChange={(e) => setFamilies(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Individuals</label>
              <input
                type="number"
                value={affectedIndividuals}
                onChange={(e) => setIndividuals(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-red-600 mb-1 tracking-wider">Dead</label>
              <input
                type="number"
                value={dead}
                onChange={(e) => setDead(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-red-200 text-red-700 rounded px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-orange-600 mb-1 tracking-wider">Injured</label>
              <input
                type="number"
                value={injured}
                onChange={(e) => setInjured(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-orange-200 text-orange-700 rounded px-3 py-2 text-sm font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Missing</label>
              <input
                type="number"
                value={missing}
                onChange={(e) => setMissing(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Narrative</label>
          <textarea
            rows={3}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Document immediate conditions..."
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-medium text-gray-500 mb-1 tracking-wider">Attachments</label>
          <div className="bg-gray-50 border border-dashed border-gray-300 p-2 rounded">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => setFiles(e.target.files)}
              className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-white file:border-gray-200 file:text-gray-900 hover:file:bg-gray-50 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold uppercase tracking-wider rounded text-xs transition-colors mt-4"
        >
          {submitting ? 'Submitting...' : 'Submit to Supervisor'}
        </button>
      </form>
    </div>
  );
};
