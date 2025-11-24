// src/store/StoreProvider.jsx
import React, { useMemo, useReducer } from "react";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../utils/api";
import { StoreCtx } from "./context";
import PropTypes from "prop-types";

const initialState = {
  deals: [],
  visits: [],
  pipes: [], // ✅ Ajout des pipes
  objectives: {}, // ex: "2025-S1": { ca: 0, marge: 0, visite: 0, one2one: 0, workshop: 0 }
  selectedSemestre: "2025-S1",
};

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload };
    case "SET_SEMESTRE":
      return { ...state, selectedSemestre: action.payload };
    case "SET_OBJECTIVES": {
      const { semestre, values } = action.payload;
      return {
        ...state,
        objectives: {
          ...state.objectives,
          [semestre]: { ...(state.objectives[semestre] || {}), ...values },
        },
      };
    }
    
    // Deals
    case "ADD_DEAL":
      return { ...state, deals: [action.payload, ...state.deals] };
    case "UPDATE_DEAL":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      };
    case "DELETE_DEAL":
      return { ...state, deals: state.deals.filter((d) => d.id !== action.payload) };
    
    // Visits
    case "ADD_VISIT":
      return { ...state, visits: [action.payload, ...state.visits] };
    case "UPDATE_VISIT":
      return {
        ...state,
        visits: state.visits.map((v) =>
          v.id === action.payload.id ? { ...v, ...action.payload } : v
        ),
      };
    case "DELETE_VISIT":
      return { ...state, visits: state.visits.filter((v) => v.id !== action.payload) };
    
    // ✅ Pipes - AJOUT COMPLET
    case "SET_PIPES":
      return { ...state, pipes: action.payload };
    case "ADD_PIPE":
      return { ...state, pipes: [action.payload, ...state.pipes] };
    case "UPDATE_PIPE":
      return {
        ...state,
        pipes: state.pipes.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
    case "DELETE_PIPE":
      return { ...state, pipes: state.pipes.filter((p) => p.id !== action.payload) };
    
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const { token, loading } = useAuth(); // ✅ Récupérer aussi loading
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydratation du store depuis le backend au montage
  React.useEffect(() => {
    // ✅ Attendre que AuthProvider ait fini de charger
    if (loading) {
      console.log('⏳ StoreProvider: En attente du chargement auth...');
      return;
    }
    
    // On ne charge les données que si on a un token
    if (!token) {
      console.log('⚠️ StoreProvider: Pas de token');
      return;
    }

    console.log('✅ StoreProvider: Hydratation avec token');

    async function hydrate() {
      try {
        const [deals, visits, pipes, objectives] = await Promise.all([
          api('/deals'),
          api('/visits'),
          api('/pipes'), // ✅ Charger les pipes aussi
          api('/objectives'),
        ]);
        
        dispatch({ 
          type: 'HYDRATE', 
          payload: { 
            deals: Array.isArray(deals) ? deals : [],
            visits: Array.isArray(visits) ? visits : [],
            pipes: Array.isArray(pipes) ? pipes : [], // ✅ Hydrater les pipes
            objectives: (Array.isArray(objectives) ? objectives : []).reduce((acc, o) => { 
              acc[o.period] = o; 
              return acc; 
            }, {})
          } 
        });
      } catch (e) {
        console.error('❌ Hydratation du store échouée', e);
      }
    }
    hydrate();
  }, [token, loading]); // ✅ Dépend du token ET du loading

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};