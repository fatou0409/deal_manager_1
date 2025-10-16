// src/components/MainContent.jsx
import React, { useState, useEffect } from "react";
import { api } from "../lib/api"; // ✅ Import de la fonction API centralisée

const MainContent = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    projet: "",      // ✅ Aligné avec le backend
    client: "",
    secteur: "",
    ca: "",          // ✅ "ca" au lieu de "montant"
    marge: "",
    statut: "En cours",
    dateCreation: "", // ✅ "dateCreation" au lieu de "date"
    semestre: "2025-S1", // ✅ Ajout du semestre
    typeDeal: "",
    commercial: "",
    supportAV: "",
  });

  // 1️⃣ Charger les deals au montage du composant
  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api("/deals"); // ✅ Utilise la fonction api()
      console.log("✅ Deals chargés depuis la BDD:", data);
      setDeals(data);
    } catch (err) {
      console.error("❌ Erreur chargement deals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Gestion des champs du formulaire
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3️⃣ Ajouter un deal via POST
  const handleAddDeal = async () => {
    if (!form.projet || !form.client || !form.ca || !form.dateCreation) {
      alert("Veuillez remplir tous les champs obligatoires (projet, client, CA, date)");
      return;
    }

    try {
      // ✅ Préparer les données au format backend
      const payload = {
        projet: form.projet,
        client: form.client,
        secteur: form.secteur || "",
        ca: parseFloat(form.ca) || 0,
        marge: parseFloat(form.marge) || 0,
        statut: form.statut,
        dateCreation: form.dateCreation,
        semestre: form.semestre,
        typeDeal: form.typeDeal || null,
        commercial: form.commercial || null,
        supportAV: form.supportAV || null,
      };

      console.log("📤 Envoi du deal:", payload);
      
      const newDeal = await api("/deals", { 
        method: "POST", 
        body: payload 
      }); // ✅ Utilise la fonction api()
      
      console.log("✅ Deal créé:", newDeal);
      
      setDeals([newDeal, ...deals]); // Ajouter en début de liste
      
      // Réinitialiser le formulaire
      setForm({ 
        projet: "",
        client: "",
        secteur: "",
        ca: "",
        marge: "",
        statut: "En cours",
        dateCreation: "",
        semestre: "2025-S1",
        typeDeal: "",
        commercial: "",
        supportAV: "",
      });
      
      alert("✅ Deal créé avec succès !");
    } catch (err) {
      console.error("❌ Erreur ajout deal:", err);
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  // 4️⃣ Supprimer un deal via DELETE
  const handleDeleteDeal = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce deal ?")) {
      return;
    }

    try {
      console.log("🗑️ Suppression du deal:", id);
      await api(`/deals/${id}`, { method: "DELETE" }); // ✅ Utilise la fonction api()
      console.log("✅ Deal supprimé");
      
      setDeals(deals.filter((deal) => deal.id !== id));
      alert("✅ Deal supprimé avec succès !");
    } catch (err) {
      console.error("❌ Erreur suppression deal:", err);
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  return (
    <main className="bg-white text-black flex-1 p-6">
      <h2 className="text-2xl font-bold mb-6">Ajouter un deal</h2>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Projet * (ex: Projet Alpha)"
          name="projet"
          value={form.projet}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Client *"
          name="client"
          value={form.client}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Secteur (ex: IT, Finance)"
          name="secteur"
          value={form.secteur}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="CA (Chiffre d'affaires) *"
          name="ca"
          value={form.ca}
          onChange={handleChange}
          className="border p-2 rounded"
          required
          min="0"
          step="0.01"
        />
        <input
          type="number"
          placeholder="Marge"
          name="marge"
          value={form.marge}
          onChange={handleChange}
          className="border p-2 rounded"
          min="0"
          step="0.01"
        />
        <select
          name="statut"
          value={form.statut}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="En cours">En cours</option>
          <option value="Gagné">Gagné</option>
          <option value="Perdu">Perdu</option>
        </select>
        <input
          type="date"
          name="dateCreation"
          value={form.dateCreation}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Semestre (ex: 2025-S1)"
          name="semestre"
          value={form.semestre}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Type de deal"
          name="typeDeal"
          value={form.typeDeal}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Commercial"
          name="commercial"
          value={form.commercial}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Support AV"
          name="supportAV"
          value={form.supportAV}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <button
        onClick={handleAddDeal}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mb-8"
      >
        Ajouter le deal
      </button>

      {/* Liste des deals */}
      <h3 className="text-xl font-semibold mb-4">Liste des deals</h3>
      
      {loading ? (
        <p>Chargement...</p>
      ) : deals.length === 0 ? (
        <p className="text-gray-500">Aucun deal pour le moment</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Projet</th>
                <th className="border p-2">Client</th>
                <th className="border p-2">Secteur</th>
                <th className="border p-2">CA (€)</th>
                <th className="border p-2">Marge (€)</th>
                <th className="border p-2">Statut</th>
                <th className="border p-2">Semestre</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="border p-2">{deal.projet}</td>
                  <td className="border p-2">{deal.client}</td>
                  <td className="border p-2">{deal.secteur || "-"}</td>
                  <td className="border p-2">{deal.ca.toFixed(2)}</td>
                  <td className="border p-2">{deal.marge.toFixed(2)}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        deal.statut === "Gagné"
                          ? "bg-green-100 text-green-800"
                          : deal.statut === "Perdu"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {deal.statut}
                    </span>
                  </td>
                  <td className="border p-2">{deal.semestre}</td>
                  <td className="border p-2">
                    {new Date(deal.dateCreation).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDeleteDeal(deal.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default MainContent;