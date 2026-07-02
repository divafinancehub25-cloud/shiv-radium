"use client";

import { useState } from "react";
import { updateBookingStatus, assignVehicle, assignDriver } from "@/actions/booking";
import { BookingStatus } from "@prisma/client";

type Vehicle = { id: string; model: string; registration: string };
type Driver = { id: string; user: { name: string; phone: string | null } };
type Booking = {
  id: string;
  status: BookingStatus;
  vehicleId: string | null;
  driverId: string | null;
};

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["VEHICLE_ASSIGNED", "CANCELLED"],
  VEHICLE_ASSIGNED: ["DRIVER_ASSIGNED", "CONFIRMED"],
  DRIVER_ASSIGNED: ["IN_PROGRESS", "VEHICLE_ASSIGNED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function BookingActions({
  booking,
  availableVehicles,
  availableDrivers,
}: {
  booking: Booking;
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(booking.vehicleId ?? "");
  const [selectedDriver, setSelectedDriver] = useState(booking.driverId ?? "");

  const transitions = ALLOWED_TRANSITIONS[booking.status];

  async function handleStatusChange(status: BookingStatus) {
    setLoading(true);
    setError("");
    const result = await updateBookingStatus({ bookingId: booking.id, status });
    if ("error" in result) setError(result.error as string);
    setLoading(false);
  }

  async function handleAssignVehicle() {
    if (!selectedVehicle) return;
    setLoading(true);
    setError("");
    const result = await assignVehicle({ bookingId: booking.id, vehicleId: selectedVehicle });
    if ("error" in result) setError(result.error as string);
    setLoading(false);
  }

  async function handleAssignDriver() {
    if (!selectedDriver) return;
    setLoading(true);
    setError("");
    const result = await assignDriver({ bookingId: booking.id, driverId: selectedDriver });
    if ("error" in result) setError(result.error as string);
    setLoading(false);
  }

  if (transitions.length === 0 && booking.status === "REFUNDED") return null;

  return (
    <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-white">Actions</h2>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map((s) => (
            <button
              key={s}
              disabled={loading}
              onClick={() => handleStatusChange(s)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-50 transition-colors"
            >
              → {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      {/* Vehicle assignment */}
      {["CONFIRMED", "VEHICLE_ASSIGNED"].includes(booking.status) && (
        <div className="flex gap-2">
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Select vehicle…</option>
            {availableVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.model} — {v.registration}
              </option>
            ))}
          </select>
          <button
            disabled={loading || !selectedVehicle}
            onClick={handleAssignVehicle}
            className="px-4 py-2 bg-[#1C69D4] hover:bg-[#1557b8] disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            Assign Vehicle
          </button>
        </div>
      )}

      {/* Driver assignment */}
      {["VEHICLE_ASSIGNED", "DRIVER_ASSIGNED"].includes(booking.status) && (
        <div className="flex gap-2">
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Select driver…</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user.name} — {d.user.phone}
              </option>
            ))}
          </select>
          <button
            disabled={loading || !selectedDriver}
            onClick={handleAssignDriver}
            className="px-4 py-2 bg-[#1C69D4] hover:bg-[#1557b8] disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            Assign Driver
          </button>
        </div>
      )}
    </div>
  );
}
