export default function DataTable({ columns, rows, empty = "Aucune donnée" }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="text-left">
          <tr className="bg-orange-50/70 text-black border-b border-orange-100">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 font-semibold">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-black/60"
                colSpan={columns.length}
              >
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, idx) => (
            <tr
              key={r.id || idx}
              className="border-b border-gray-100 odd:bg-white even:bg-orange-50/20 hover:bg-orange-50 transition-colors"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2 align-top">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
