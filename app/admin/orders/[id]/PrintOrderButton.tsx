"use client";

// Prints the order page (design previews + manufacturing details) so the
// admin can Save-as-PDF or screenshot the customer's exact final design.
export default function PrintOrderButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
    >
      🖨 Print / Save Design
    </button>
  );
}
