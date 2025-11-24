import React, { useEffect, useState } from "react";
import EditDeal from "./EditDeal.jsx";
import { api } from "../utils/api";

const DealsList = () => {
  const [deals, setDeals] = useState([]);
  const [editingDeal, setEditingDeal] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api("/deals");
        if (mounted) setDeals(data || []);
      } catch (err) {
        console.error("Erreur chargement deals:", err);
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce deal ?")) return;
    try {
      await api(`/deals/${id}`, { method: "DELETE" });
      setDeals(deals.filter(d => d.id !== id));
    } catch (err) {
      console.error("Erreur suppression deal:", err);
      alert(`Erreur suppression: ${err.message}`);
    }
  };

  const handleUpdate = (updatedDeal) => {
    setDeals(deals.map(d => (d.id === updatedDeal.id ? updatedDeal : d)));
    setEditingDeal(null);
  };

  return (
    <div>
      {editingDeal ? (
        <EditDeal
          deal={editingDeal}
          onSave={handleUpdate}
          onCancel={() => setEditingDeal(null)}
        />
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Projet</th>
              <th className="border p-2">Client</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map(deal => (
              <tr key={deal.id}>
                <td className="border p-2">{deal.projet}</td>
                <td className="border p-2">{deal.client}</td>
                <td className="border p-2 flex gap-2">
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded"
                          onClick={() => setEditingDeal(deal)}>
                    Modifier
                  </button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => handleDelete(deal.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DealsList;
