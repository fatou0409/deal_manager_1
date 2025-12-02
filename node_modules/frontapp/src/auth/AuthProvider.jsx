// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { canRole } from "./permissions";
import PropTypes from "prop-types";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  // Hydrate synchronously from localStorage so initial render has auth state
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  // loading is false because we hydrate synchronously
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
    
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    let data = null;
    try { 
      data = await res.json(); 
    } catch (e) {
      // Erreur de parsing JSON, gérée par la suite
    }
    
    if (!res.ok) {
      throw new Error(data?.message || `HTTP ${res.status}`);
    }
    
    // 🔑 IMPORTANT : Inclure mustChangePassword dans safeUser
    const safeUser = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name || "",
      firstName: data.user.firstName || "",
      lastName: data.user.lastName || "",
      mustChangePassword: !!data.user.mustChangePassword, // ← CRITIQUE
    };
    
    // Stocker dans localStorage ET dans le state
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(safeUser));
    
    setUser(safeUser);
    setToken(data.token);
  };

  const logout = () => {
    // Supprimer de localStorage ET du state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setUser(null);
    setToken(null);
  };

  // 🔑 Changer le mot de passe ET mettre à jour mustChangePassword
  const changePassword = async ({ currentPassword, newPassword }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
    
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    let data = null;
    try { data = await res.json(); } catch {}
    
    if (!res.ok) {
      throw new Error(data?.message || `Erreur changement mot de passe`);
    }
    
    // 🔑 IMPORTANT : Mettre à jour le user avec les données retournées par le backend
    if (data.user) {
      const updatedUser = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        name: data.user.name || "",
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        mustChangePassword: !!data.user.mustChangePassword
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    
    return data;
  };

  // Helper permission: can("deal:create")
  const can = (ability) => canRole(user?.role, ability);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, can, changePassword }),
    [user, token, loading]
  );
  
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};