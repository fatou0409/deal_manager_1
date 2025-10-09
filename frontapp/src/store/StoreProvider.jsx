// src/store/StoreProvider.jsx
import React, { useMemo, useReducer } from "react";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import { StoreCtx } from "./context"; // Import the context

const initialState = {
  deals: [],
  visits: [],
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
    default:
      return state;
  }
}

import PropTypes from "prop-types";

export function StoreProvider({ children }) {
  const { token } = useAuth(); // On récupère le token d'authentification
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydratation du store depuis le backend au montage
  React.useEffect(() => {
    // On ne charge les données que si on a un token
    if (!token) return;

    async function hydrate() {
      try {
        const [deals, visits, objectives] = await Promise.all([
          api('/deals', { token }),
          api('/visits', { token }),
          api('/objectives', { token }),
        ]);
        dispatch({ type: 'HYDRATE', payload: { deals: deals.items || [], visits, objectives: (objectives || []).reduce((acc, o) => { acc[o.period] = o; return acc; }, {}) } });
      } catch (e) {
        console.error('Hydratation du store échouée', e);
      }
    }
    hydrate();
  }, [token]); // Le useEffect dépend maintenant du token

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
