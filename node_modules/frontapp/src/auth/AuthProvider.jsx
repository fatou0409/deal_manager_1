// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { canRole } from "./permissions";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// ...existing code...

import PropTypes from "prop-types";

export function AuthProvider({ children }) {
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
  const [user, setUser] = useState(null);   // { email, role, firstName?, lastName?, mustChangePassword? }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // hydrate: plus de localStorage, tout vient du backend (token en mémoire)
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async ({ email, password }) => {
    // Appel réel au backend
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    const safeUser = {
      email: data.user.email,
      role: data.user.role,
      firstName: data.user.firstName || "",
      lastName: data.user.lastName || "",
      mustChangePassword: !!data.user.mustChangePassword,
      id: data.user.id,
    };
    setUser(safeUser);
    setToken(data.token);

  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // changer le MDP de l'utilisateur courant
  const changePassword = async ({ currentPassword, newPassword }) => {
    throw new Error("Non supporté en mode connecté au backend");
  };

  // Helper permission: can("deal:create")
  const can = (ability) => canRole(user?.role, ability);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, can, changePassword }),
    [user, token, loading]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
