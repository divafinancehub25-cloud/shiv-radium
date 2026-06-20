"use client";

import { useRouter } from "next/navigation";
import { createVehicle } from "@/actions/vehicle";
import { useState } from "react";

const BMW_MODELS = [
  "BMW 3 Series",
  "BMW 5 Series",
  "BMW 7 Series",
  "BMW X1",
  "BMW X3",
  "BMW X5",
  "BMW X7",
  "BMW 6 Series GT",
];

const FEATURES = [
  "Leather Seats",
  "Sunroof",
  "GPS Navigation",
  "Bluetooth",
  "Wi-Fi",
  "Mineral Water",
  "Umbrella",
  "Phone Charger",
  "AC",
  "iDrive",
];

export function VehicleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  function toggleFeature(f: string) {
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("features", selectedFeatures.join(","));

    const result = await createVehicle(formData);

    if ("error" in result && typeof result.error === "object") {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else if ("success" in result) {
      router.push("/admin/vehicles");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Model *</label>
          <select
            name="model"
            required
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
          >
            <option value="">Select model…</option>
            {BMW_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Year *</label>
          <input
            name="year"
            type="number"
            required
            min="2000"
            max={new Date().getFullYear() + 1}
            defaultValue={new Date().getFullYear()}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
          />
          {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Registration No. *</label>
          <input
            name="registration"
            type="text"
            required
            placeholder="RJ14AB1234"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white uppercase"
            style={{ textTransform: "uppercase" }}
          />
          {errors.registration && <p className="text-red-400 text-xs mt-1">{errors.registration[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Color *</label>
          <input
            name="color"
            type="text"
            required
            placeholder="Alpine White"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
          />
          {errors.color && <p className="text-red-400 text-xs mt-1">{errors.color[0]}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Brief description of the vehicle…"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Features</label>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFeature(f)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                selectedFeatures.includes(f)
                  ? "bg-[#1C69D4]/20 border-[#1C69D4] text-[#1C69D4]"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1C69D4] hover:bg-[#1557b8] disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Saving…" : "Add Vehicle"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-zinc-700 text-zinc-300 hover:border-zinc-500 px-6 py-2.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
