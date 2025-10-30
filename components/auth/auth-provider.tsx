// components/auth/AuthProvider.tsx (A better location for this component)
"use client";

import { SessionPayload } from "@/lib/auth/hooks";
import React, { createContext, useContext, ReactNode } from "react";

// Define the shape of your context data
interface AuthContextType {
  user: SessionPayload | null;
  // You could add other things here later, like login/logout functions
}

// Create the context with a type and a default value of null
const AuthContext = createContext<AuthContextType | null>(null);

// The provider component will receive the user session as a PROP
export function AuthProvider({
  children,
  user, // The session data fetched from the server
}: {
  children: ReactNode;
  user: SessionPayload | null;
}) {
  return (
    // The value now matches the AuthContextType
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook to use the context in other client components
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}