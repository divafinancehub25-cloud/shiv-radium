"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-gray-900 hover:bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
    >
      ⬇ Download / Print PDF
    </button>
  );
}
