import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CommandCenterView } from './components/dashboard/CommandCenterView';
import { IncidentEncodingForm } from './components/incidents/IncidentEncodingForm';
import { SupervisorValidationQueue } from './components/supervisor/SupervisorValidationQueue';
import { UserManagement } from './components/admin/UserManagement';
import { DisasterMap } from './components/map/DisasterMap';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';
import { IncidentReport, UserRole } from './types/disaster-system';
import { animate } from 'animejs';

const TopNav = () => {
  const { profile, role, currentUser, logout } = useAuth();
  const location = useLocation();

  const navItemClass = (path: string) => 
    `px-4 py-2 text-sm rounded transition-colors ${location.pathname === path ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`;

  if (!profile && !currentUser) {
    return null;
  }

  return (
    <header className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200">
          <img src="https://scontent.fcgy2-2.fna.fbcdn.net/v/t39.30808-6/412221151_742093824621688_5844651270257856003_n.jpg?stp=dst-jpg_tt6&cstp=mx947x960&ctp=s947x960&_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEEz_wgPaRCERKotbVa-3FBSZCxuKebjr5JkLG4p5uOvnw3g8cv_rPcddEZoqraPetJDvMNMjeb858gS3UwQcfF&_nc_ohc=GcWqx4wcXZkQ7kNvwEbtOsD&_nc_oc=Adp9Ps2UiEY858Z-JxAC4eXFj9r0bY8bZ_aeAsWgljmey1jaEPFZWlw8M7zY1WXsgaI&_nc_zt=23&_nc_ht=scontent.fcgy2-2.fna&_nc_gid=jd5E8RS17SrAy27tkK93Kw&_nc_ss=7b2a8&oh=00_AQJCqbcDJDNZpEmtws7xG2XTWEGeJUza4oHahuXFwkndJw&oe=6AAC9703" alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">CDRRMD EOC</h1>
          <p className="text-xs text-gray-500">Command Center</p>
        </div>
      </div>
      
      <nav className="hidden md:flex space-x-1">
        <Link to="/dashboard" className={navItemClass('/dashboard')}>Dashboard</Link>
        <Link to="/map" className={navItemClass('/map')}>Map</Link>
        {(role === 'ENCODER' || role === 'SUPERVISOR' || role === 'ADMIN') && (
          <Link to="/encode" className={navItemClass('/encode')}>Encode</Link>
        )}
        {(role === 'SUPERVISOR' || role === 'ADMIN') && (
          <>
            <Link to="/queue" className={navItemClass('/queue')}>Queue</Link>
            <Link to="/users" className={navItemClass('/users')}>Users</Link>
          </>
        )}
      </nav>

      <div className="flex items-center space-x-6">
        {profile ? (
          <div className="text-right flex items-center space-x-4">
             <div className="text-right">
               <p className="text-sm font-medium text-gray-900">{profile.displayName}</p>
               <p className="text-xs text-gray-500">{role}</p>
             </div>
             <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded">
               Logout
             </button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Authenticating...</span>
        )}
      </div>
    </header>
  );
};

const AuthForm = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    animate(containerRef.current, {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 800,
      ease: 'outExpo'
    });
  }, []);
  
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
         setError('Sign-in popup was closed before completion.');
      } else {
         setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div ref={containerRef} className="bg-white border border-gray-200 p-8 rounded-xl max-w-md w-full shadow-sm opacity-0">
         <div className="flex flex-col items-center mb-6">
           <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden mb-4 border border-gray-200">
             <img src="https://scontent.fcgy2-2.fna.fbcdn.net/v/t39.30808-6/412221151_742093824621688_5844651270257856003_n.jpg?stp=dst-jpg_tt6&cstp=mx947x960&ctp=s947x960&_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEEz_wgPaRCERKotbVa-3FBSZCxuKebjr5JkLG4p5uOvnw3g8cv_rPcddEZoqraPetJDvMNMjeb858gS3UwQcfF&_nc_ohc=GcWqx4wcXZkQ7kNvwEbtOsD&_nc_oc=Adp9Ps2UiEY858Z-JxAC4eXFj9r0bY8bZ_aeAsWgljmey1jaEPFZWlw8M7zY1WXsgaI&_nc_zt=23&_nc_ht=scontent.fcgy2-2.fna&_nc_gid=jd5E8RS17SrAy27tkK93Kw&_nc_ss=7b2a8&oh=00_AQJCqbcDJDNZpEmtws7xG2XTWEGeJUza4oHahuXFwkndJw&oe=6AAC9703" alt="CDRRMD Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
           </div>
           <h1 className="text-xl font-semibold text-gray-900 text-center">EOC Command Center</h1>
           <p className="text-gray-500 text-sm mt-2 text-center">{isLogin ? 'Sign in to continue.' : 'Create an account.'}</p>
         </div>

         {error && (
           <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
             {error}
           </div>
         )}

         <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
           {!isLogin && (
             <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
               <input 
                 type="text" 
                 required 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
               />
             </div>
           )}
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
             <input 
               type="email" 
               required 
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
             <input 
               type="password" 
               required 
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
             />
           </div>
           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors disabled:opacity-50"
           >
             {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
           </button>
         </form>

         <div className="relative mb-6">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-gray-300"></div>
           </div>
           <div className="relative flex justify-center text-sm">
             <span className="px-2 bg-white text-gray-500">Or continue with</span>
           </div>
         </div>

         <button
           onClick={handleGoogleLogin}
           disabled={loading}
           type="button"
           className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
         >
           Google
         </button>

         <div className="mt-6 text-center">
           <button 
             type="button" 
             onClick={() => setIsLogin(!isLogin)}
             className="text-sm text-blue-600 hover:text-blue-800"
           >
             {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
           </button>
         </div>
      </div>
    </div>
  );
};

const MapWrapper = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'incidents'), where('status', '==', 'VERIFIED'));
    const unsub = onSnapshot(q, (snap) => {
      const items: IncidentReport[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as IncidentReport) }));
      setIncidents(items);
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-8 h-[calc(100vh-73px)] bg-gray-50">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Common Operational Picture</h2>
      <div className="h-full w-full rounded border border-gray-200 overflow-hidden bg-white">
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <DisasterMap incidents={incidents} resources={[]} />
        </APIProvider>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { profile, role, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">Loading...</div>;
  if (!profile) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

const Main = () => {
  const { profile, loading } = useAuth();
  const mainRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      animate(mainRef.current, {
        opacity: [0, 1],
        duration: 600,
        ease: 'linear'
      });
    }
  }, [loading, profile]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">Connecting...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col" ref={mainRef}>
      <BrowserRouter>
        <TopNav />
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={!profile ? <AuthForm /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<ProtectedRoute><CommandCenterView /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapWrapper /></ProtectedRoute>} />
            <Route path="/encode" element={<ProtectedRoute allowedRoles={['ENCODER', 'SUPERVISOR', 'ADMIN']}><div className="p-8"><IncidentEncodingForm /></div></ProtectedRoute>} />
            <Route path="/queue" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}><div className="p-8"><SupervisorValidationQueue /></div></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}><UserManagement /></ProtectedRoute>} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
