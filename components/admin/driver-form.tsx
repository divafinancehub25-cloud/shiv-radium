"use client";

import { useRouter } from "next/navigation";
import { createDriver } from "@/actions/driver";
import { useState } from "react";

const CITIES = ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Ajmer", "Delhi", "Agra", "Bikaner", "Pushkar", "Kota", "Ranthambore"];

export function DriverForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await createDriver(formData);

    if ("error" in result && typeof result.error === "object") {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else if ("success" in result) {
      router.push("/admin/drivers");
    }
  }

  function Field({ name, label, type = "text", placeholder, required }: {
    name: string; label: string; type?: string; placeholder?: string; required?: boolean;
  }) {
    return (
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          {label} {required && "*"}
        </label>
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500"
        />
        {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name][0]}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="name" label="Full Name" placeholder="Rajesh Kumar" required />
        <Field name="phone" label="Phone" type="tel" placeholder="9876543210" required />
        <Field name="email" label="Email" type="email" placeholder="driver@example.com" required />
        <Field name="password" label="Password" type="password" placeholder="Min 8 characters" required />
        <Field name="licenseNo" label="License Number" placeholder="RJ1420210012345" required />
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">License Expiry *</label>
          <input
            name="licenseExp"
            type="date"
            required
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
          />
          {errors.licenseExp && <p className="text-red-400 text-xs mt-1">{errors.licenseExp[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Base City</label>
          <select
            name="city"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white"
          >
            <option value="">Select city…</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Field name="address" label="Address" placeholder="Full address" />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Any additional notes…"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1C69D4] hover:bg-[#1557b8] disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Saving…" : "Add Driver"}
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
