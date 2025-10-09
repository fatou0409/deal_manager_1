import ProgressBar from "./ProgressBar";

export default function KPIWidget({
  label,
  value,
  target,
  renderValue,
  suffix = "",
}) {
  const v = Number(value || 0);
  const t = Number(target || 0);
  const pct = t ? Math.round((v / t) * 100) : 0;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium tracking-wide text-black/70 uppercase">
          {label}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 border border-orange-200">
          {pct}%
        </span>
      </div>

      <div className="mt-2 text-2xl font-semibold text-black">
        {renderValue ? renderValue(v) : v}
        {suffix}
      </div>

      <div className="mt-1 text-xs text-black/60">
        Objectif&nbsp;:{" "}
        <span className="font-medium text-black">
          {renderValue ? renderValue(t) : t}
          {suffix}
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar value={pct} />
      </div>
    </div>
  );
}
