// src/components/Deals.jsx
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";// ✅ Import de la fonction API centralisée

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api("/deals"); // ✅ Utilise la fonction api()
      setDeals(data);
    } catch (err) {
      console.error("Erreur chargement deals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Chargement des deals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Liste des Deals</h2>
      
      {deals.length === 0 ? (
        <p className="text-gray-500">Aucun deal disponible</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {deals.map((deal) => (
            <li key={deal.id} className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">{deal.titre || deal.nom}</h3>
              <p className="text-gray-600 mt-1">{deal.description || deal.client}</p>
              {deal.montant && (
                <p className="text-green-600 font-medium mt-2">
                  {deal.montant} €
                </p>
              )}
              {deal.statut && (
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    deal.statut === "Gagné"
                      ? "bg-green-100 text-green-800"
                      : deal.statut === "Perdu"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {deal.statut}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Deals;
