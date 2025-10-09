// src/components/ActionButtons.jsx
export function EditButton({ onClick, className = "", children = "Éditer" }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition
                  hover:bg-orange-100 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-400 ${className}`}
      title="Éditer"
    >
      <svg className="h-3.5 w-3.5 opacity-80 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      {children}
    </button>
  );
}

export function DeleteButton({ onClick, className = "", children = "Supprimer" }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition
                  hover:bg-red-100 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-400 ${className}`}
      title="Supprimer"
    >
      <svg className="h-3.5 w-3.5 opacity-80 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      </svg>
      {children}
    </button>
  );
}
