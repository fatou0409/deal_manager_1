import React, { useState, useEffect } from "react";


const MainContent = () => {
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState({
    nom: "",
    client: "",
    montant: "",
    secteur: "",
    projets: "",
    statut: "En cours",
    date: "",
  });

  const API_URL = import.meta.env.VITE_API_URL + "/deals";

  // 1️⃣ Charger les deals au montage du composant
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setDeals(data))
      .catch((error) => console.error("Erreur API :", error));
  }, []);

  // 2️⃣ Gestion des champs du formulaire
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3️⃣ Ajouter un deal via POST
  const handleAddDeal = () => {
    if (!form.nom || !form.client || !form.montant || !form.date) return;
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        setDeals([...deals, data]);
        setForm({ nom: "", client: "", montant: "", statut: "En cours", date: "" });
      })
      .catch((error) => console.error("Erreur ajout deal :", error));
  };

  // 4️⃣ Supprimer un deal via DELETE
  const handleDeleteDeal = (id) => {
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(() => {
        setDeals(deals.filter((deal) => deal.id !== id));
      })
      .catch((error) => console.error("Erreur suppression deal :", error));
  };

  return (
    <main className="bg-white text-black flex-1 p-6">
      <h2 className="text-2xl font-bold mb-6">Ajouter un deal</h2>

      {/* Formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Nom du deal"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="Client"
          name="client"
          value={form.client}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="number"
          placeholder="Montant"
          name="montant"
          value={form.montant}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="Secteur"
          name="secteur"
          value={form.secteur}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="Projets en vue"
          name="projets"
          value={form.projets}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        />
        <select
          name="statut"
          value={form.statut}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        >
          <option>En cours</option>
          <option>Terminé</option>
          <option>Annulé</option>
        </select>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <button
        onClick={handleAddDeal}
        className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 mb-8"
      >
        Ajouter Deal
      </button>

      {/* Tableau des deals */}
      <h2 className="text-2xl font-bold mb-4">Liste des deals</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Nom</th>
              <th className="border p-2 text-left">Client</th>
              <th className="border p-2 text-left">Montant</th>
              <th className="border p-2 text-left">Secteur</th>
              <th className="border p-2 text-left">Projets en vue</th>
              <th className="border p-2 text-left">Statut</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50">
                <td className="border p-2">{deal.nom}</td>
                <td className="border p-2">{deal.client}</td>
                <td className="border p-2">{deal.montant}</td>
                <td className="border p-2">{deal.secteur}</td>
                <td className="border p-2">{deal.projets}</td>
                <td className="border p-2">{deal.statut}</td>
                <td className="border p-2">{deal.date}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default MainContent;
