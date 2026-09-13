import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole, UserProfile } from '../types/disaster-system';

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  role: 'VIEWER',
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  signupWithEmail: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [loading, setLoading] = useState<boolean>(true);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: name || 'Unnamed User',
      role: 'VIEWER',
      agencyDivision: 'EOC Command',
      contactNumber: '',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
    setRole('VIEWER');
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
    const user = userCred.user;
    
    // Check if profile exists, if not, create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Unnamed User',
        role: 'VIEWER', // Default role
        agencyDivision: 'EOC Command',
        contactNumber: '',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
      setRole('VIEWER');
    } else {
      const data = userDoc.data() as UserProfile;
      setProfile(data);
      setRole(data.role || 'VIEWER');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setRole('VIEWER');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setProfile(data);
            setRole(data.role || 'VIEWER');
          } else {
            setRole('VIEWER');
          }
        } catch (e) {
          console.error("RBAC Profile fetching failure", e);
          setRole('VIEWER');
        }
      } else {
        setProfile(null);
        setRole('VIEWER');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, profile, role, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
