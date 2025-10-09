export default function FormField({ label, children, required, hint }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">
        {label} {required && <span className="text-orange-600">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-xs text-black/60 mt-1">{hint}</p>}
    </label>
  );
}
