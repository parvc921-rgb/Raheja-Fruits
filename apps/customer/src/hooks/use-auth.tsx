"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { CustomerProfile } from "@raheja/shared";

interface AuthContextValue {
  user: User | null;
  profile: CustomerProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    // customers/{uid} — Security Rules allow a customer to read only
    // their own doc. pinHash is never selected out here on purpose,
    // even though rules would technically allow reading the whole doc;
    // the CustomerProfile type omits it so nothing downstream can leak it.
    const unsubProfile = onSnapshot(doc(db, "customers", user.uid), (snap) => {
      if (snap.exists()) {
        const { pinHash: _pinHash, ...rest } = snap.data() as Record<string, unknown>;
        setProfile({ id: snap.id, ...rest } as CustomerProfile);
      }
      setLoading(false);
    });
    return unsubProfile;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
