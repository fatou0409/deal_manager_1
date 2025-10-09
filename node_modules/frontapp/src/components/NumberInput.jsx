export default function NumberInput({
  value,
  onChange,
  step = 1,
  placeholder = "0",
  className = "",
  ...rest
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      onChange={(e) =>
        onChange?.(e.target.value === "" ? "" : Number(e.target.value))
      }
      placeholder={placeholder}
      step={step}
      className={`w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-orange-600 focus:border-orange-600 ${className}`}
      {...rest}
    />
  );
}
