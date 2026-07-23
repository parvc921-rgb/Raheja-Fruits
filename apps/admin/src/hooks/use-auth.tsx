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
import type { Admin } from "@raheja/shared";

interface AdminAuthContextValue {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  admin: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setAdmin(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    // admins/{uid} — Security Rules let a signed-in user read their own
    // admin doc regardless of isActive, which is required to even
    // determine isActive in the first place (see firestore.rules).
    const unsubAdmin = onSnapshot(doc(db, "admins", user.uid), (snap) => {
      setAdmin(snap.exists() ? ({ id: snap.id, ...snap.data() } as Admin) : null);
      setLoading(false);
    });
    return unsubAdmin;
  }, [user]);

  return (
    <AdminAuthContext.Provider value={{ user, admin, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AdminAuthContext);
}
