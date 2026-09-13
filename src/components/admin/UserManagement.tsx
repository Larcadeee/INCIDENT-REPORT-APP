import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { UserProfile, UserRole } from '../../types/disaster-system';
import { useAuth } from '../../context/AuthContext';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { role } = useAuth();

  useEffect(() => {
    if (role !== 'SUPERVISOR' && role !== 'ADMIN') return;

    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const items: UserProfile[] = [];
      snap.forEach((d) => items.push(d.data() as UserProfile));
      setUsers(items);
    });

    return () => unsub();
  }, [role]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole
      });
    } catch (err) {
      console.error("Error updating role", err);
      alert("Failed to update role. Please ensure you have appropriate permissions.");
    }
  };

  return (
    <div className="flex-grow flex flex-col p-8">
      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm max-w-5xl mx-auto w-full">
        <div className="mb-6 border-b border-gray-100 pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900">User Access Management</h2>
          <p className="text-xs text-gray-500 mt-1">Assign roles to personnel. Only Supervisors can modify access levels.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-medium">
                <th className="pb-3 px-4">Name</th>
                <th className="pb-3 px-4">Email</th>
                <th className="pb-3 px-4">Current Role</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{u.displayName}</td>
                  <td className="py-3 px-4 text-gray-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase ${
                      u.role === 'SUPERVISOR' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'ENCODER' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="VIEWER">Make Viewer</option>
                      <option value="ENCODER">Make Encoder</option>
                      <option value="SUPERVISOR">Make Supervisor</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
