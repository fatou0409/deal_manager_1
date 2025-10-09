// src/components/Deals.jsx
import React, { useEffect, useState } from "react";

const Deals = () => {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/deals")
      .then((res) => res.json())
      .then((data) => setDeals(data))
      .catch((err) => console.error("Erreur API :", err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Liste des Deals</h2>
      <ul className="mt-2">
        {deals.map((deal) => (
          <li key={deal.id} className="border p-2 my-2 rounded">
            <h3 className="font-semibold">{deal.titre}</h3>
            <p>{deal.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Deals;
