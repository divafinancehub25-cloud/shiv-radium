"use client";
import { useState, useEffect } from "react";
import { MapPin, ChevronDown, X } from "lucide-react";

const DEFAULT_LOCATION = "Bhopal, Madhya Pradesh";

export default function LocationBar() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("delivery_location");
    if (saved) setLocation(saved);
  }, []);

  function save() {
    if (!city.trim()) return;
    const loc = pin.trim() ? `${city.trim()} - ${pin.trim()}` : city.trim();
    localStorage.setItem("delivery_location", loc);
    setLocation(loc);
    setOpen(false);
    setCity("");
    setPin("");
  }

  return (
    <>
      <div className="flex items-center justify-between mt-2 px-1">
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-orange-500" />
          <span>Deliver to: <strong className="text-gray-800">{location}</strong></span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button
          onClick={() => setOpen(true)}
          className="text-[10px] text-orange-500 font-semibold border border-orange-300 rounded-lg px-2 py-0.5 hover:bg-orange-50 transition-colors"
        >
          Change Location
        </button>
      </div>

      {/* Location modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Delivery Location
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City / Area *</label>
                <input
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. Indore, Madhya Pradesh"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pincode (optional)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. 452001"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
              </div>
              <button
                onClick={save}
                disabled={!city.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
