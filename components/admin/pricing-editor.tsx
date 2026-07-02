"use client";

import { useState } from "react";
import { updatePricingRule } from "@/actions/pricing";
import { formatCurrency } from "@/lib/utils";
type PricingRule = {
  id: string;
  packageType: string;
  basePrice: { toString(): string } | number;
  includedKm: number;
  includedHours: number | null;
  extraKmRate: { toString(): string } | number;
  extraHourRate: { toString(): string } | number | null;
  nightCharge: { toString(): string } | number | null;
  driverAllowance: { toString(): string } | number | null;
  minKm: number | null;
  ratePerKm: { toString(): string } | number | null;
};

const PACKAGE_LABELS: Record<string, string> = {
  TRANSFER: "Transfer Package",
  LOCAL: "Local Package (4hrs / 40km)",
  FULL_DAY: "Full Day Package (8hrs / 80km)",
  OUTSTATION: "Outstation Package",
};

export function PricingEditor({ rules }: { rules: PricingRule[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  async function handleSave(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data: Record<string, number> = {};
    for (const [k, v] of form.entries()) {
      if (v !== "") data[k] = Number(v);
    }
    await updatePricingRule(id, data);
    setSaved(id);
    setEditing(null);
    setLoading(false);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.id} className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{PACKAGE_LABELS[rule.packageType]}</h3>
            <div className="flex gap-2">
              {saved === rule.id && (
                <span className="text-xs text-green-400 px-2 py-1 rounded bg-green-900/20 border border-green-800">
                  Saved ✓
                </span>
              )}
              {editing === rule.id ? (
                <button
                  form={`form-${rule.id}`}
                  type="submit"
                  disabled={loading}
                  className="text-xs bg-[#1C69D4] hover:bg-[#1557b8] disabled:opacity-50 text-white px-3 py-1 rounded-lg"
                >
                  {loading ? "Saving…" : "Save"}
                </button>
              ) : (
                <button
                  onClick={() => setEditing(rule.id)}
                  className="text-xs border border-zinc-700 text-zinc-400 hover:text-white px-3 py-1 rounded-lg"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {editing === rule.id ? (
            <form id={`form-${rule.id}`} onSubmit={(e) => handleSave(rule.id, e)}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {rule.packageType !== "OUTSTATION" && (
                  <>
                    <NumField label="Base Price (₹)" name="basePrice" defaultValue={Number(rule.basePrice)} />
                    <NumField label="Included KM" name="includedKm" defaultValue={rule.includedKm} />
                    <NumField label="Extra KM Rate (₹)" name="extraKmRate" defaultValue={Number(rule.extraKmRate)} />
                  </>
                )}
                {rule.includedHours != null && (
                  <>
                    <NumField label="Included Hours" name="includedHours" defaultValue={rule.includedHours} />
                    <NumField label="Extra Hour Rate (₹)" name="extraHourRate" defaultValue={Number(rule.extraHourRate ?? 0)} />
                  </>
                )}
                {rule.packageType === "OUTSTATION" && (
                  <>
                    <NumField label="Rate per KM (₹)" name="ratePerKm" defaultValue={Number(rule.ratePerKm ?? 50)} />
                    <NumField label="Min KM" name="minKm" defaultValue={rule.minKm ?? 250} />
                    <NumField label="Night Charge (₹)" name="nightCharge" defaultValue={Number(rule.nightCharge ?? 300)} />
                    <NumField label="Driver Allowance (₹)" name="driverAllowance" defaultValue={Number(rule.driverAllowance ?? 500)} />
                  </>
                )}
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {rule.packageType !== "OUTSTATION" && (
                <>
                  <Stat label="Base Price" value={formatCurrency(Number(rule.basePrice))} />
                  <Stat label="Included KM" value={`${rule.includedKm} km`} />
                  <Stat label="Extra KM Rate" value={`₹${Number(rule.extraKmRate)}/km`} />
                </>
              )}
              {rule.includedHours != null && (
                <>
                  <Stat label="Included Hours" value={`${rule.includedHours} hrs`} />
                  <Stat label="Extra Hour Rate" value={`₹${Number(rule.extraHourRate ?? 0)}/hr`} />
                </>
              )}
              {rule.packageType === "OUTSTATION" && (
                <>
                  <Stat label="Rate/KM" value={`₹${Number(rule.ratePerKm ?? 50)}/km`} />
                  <Stat label="Min KM" value={`${rule.minKm ?? 250} km`} />
                  <Stat label="Night Charge" value={`₹${Number(rule.nightCharge ?? 300)}`} />
                  <Stat label="Driver Allowance" value={`₹${Number(rule.driverAllowance ?? 500)}/day`} />
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NumField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        name={name}
        type="number"
        step="0.01"
        defaultValue={defaultValue}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-zinc-200 font-medium">{value}</p>
    </div>
  );
}
