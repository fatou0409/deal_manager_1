
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";

export default function Pipe() {
  const { token } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    api("/deals", { token })
      .then((data) => setDeals(data.items || []))
      .catch((e) => setErr(e.message || "Erreur API"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pipe</h1>
      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        {err && <div className="mb-2 text-red-600">{err}</div>}
        {loading ? (
          <div className="text-black/60">Chargement…</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-black/70">
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">IC</th>
                <th className="py-2 pr-4">Secteur</th>
                <th className="py-2 pr-4">Projets en vue</th>
                <th className="py-2 pr-4">Budget estimatif</th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr><td colSpan={5} className="py-2 text-black/50">Aucun deal</td></tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="py-2 pr-4">{deal.title}</td>
                    <td className="py-2 pr-4">{deal.owner?.name || deal.owner?.email || "-"}</td>
                    <td className="py-2 pr-4">{deal.secteur || "-"}</td>
                    <td className="py-2 pr-4">{deal.projets || "-"}</td>
                    <td className="py-2 pr-4">{deal.amount?.toLocaleString() || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
