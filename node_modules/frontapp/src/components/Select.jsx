export default function Select({
  value,
  onChange,
  options,
  placeholder = "—",
  className = "",
  ...rest
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-orange-600 focus:border-orange-600 ${className}`}
      {...rest}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
