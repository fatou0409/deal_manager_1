import React, { useState } from "react";
import PropTypes from "prop-types";

const EditDeal = ({ deal, onSave, onCancel }) => {
  // État local pour chaque champ du deal
  const [formData, setFormData] = useState({
    name: deal.name || "",
    description: deal.description || "",
    price: deal.price || "",
    category: deal.category || "",
    secteur: deal.secteur || "",
    projets: deal.projets || "",
    startDate: deal.startDate || "",
    endDate: deal.endDate || "",
  });

  // Gestion des changements dans les inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Sauvegarde du deal
  const handleSave = () => {
    onSave({ ...deal, ...formData });
  };


  return (
    <div className="p-6 border rounded-lg shadow-md bg-white max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Modifier le deal</h2>

      {/* Nom */}
      <div className="mb-4">
        <label htmlFor="deal-name" className="block text-gray-700 font-semibold mb-1">Nom</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Prix */}
      <div className="mb-4">
        <label htmlFor="deal-price" className="block text-gray-700 font-semibold mb-1">Prix</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Catégorie */}
      <div className="mb-4">
        <label htmlFor="deal-category" className="block text-gray-700 font-semibold mb-1">Catégorie</label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Secteur */}
      <div className="mb-4">
        <label htmlFor="deal-secteur" className="block text-gray-700 font-semibold mb-1">Secteur</label>
        <input
          type="text"
          name="secteur"
          value={formData.secteur}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Projets en vue */}
      <div className="mb-4">
        <label htmlFor="deal-projets" className="block text-gray-700 font-semibold mb-1">Projets en vue</label>
        <input
          type="text"
          name="projets"
          value={formData.projets}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Dates */}
      <div className="mb-4">
        <label htmlFor="deal-startDate" className="block text-gray-700 font-semibold mb-1">Date de début</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="deal-endDate" className="block text-gray-700 font-semibold mb-1">Date de fin</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
};

EditDeal.propTypes = {
  deal: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default EditDeal;
