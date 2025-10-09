// src/components/TextInput.jsx
export default function TextInput({ className = "", ...rest }) {
  return (
    <input
      className={`w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-orange-600 focus:border-orange-600 ${className}`}
      {...rest}
    />
  );
}
