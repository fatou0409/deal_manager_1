export default function ProgressBar({ value = 0 }) {
  const v = Math.min(100, Math.max(0, Number(value || 0)));
  return (
    <div className="w-full h-2 rounded-full bg-gray-200/70 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-black transition-[width] duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
