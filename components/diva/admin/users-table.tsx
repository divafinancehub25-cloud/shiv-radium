"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MoreHorizontal, Eye, UserX, UserCheck } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { updateUserStatus } from "@/actions/diva/admin";
import Link from "next/link";
import type { AdminUserRow } from "@/types/diva";

type Props = {
  users: AdminUserRow[];
  total: number;
  pages: number;
  currentPage: number;
  onSearch: (q: string) => void;
  onStatusFilter: (s: string) => void;
  onPageChange: (p: number) => void;
};

const STATUS_FILTERS = ["All", "ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "LOCKED"];

export function UsersTable({ users, total, pages, currentPage, onSearch, onStatusFilter, onPageChange }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    onSearch(e.target.value);
  }

  function handleFilter(s: string) {
    setStatusFilter(s);
    onStatusFilter(s === "All" ? "" : s);
  }

  async function toggleActive(userId: string, current: boolean) {
    setActionUserId(userId);
    await updateUserStatus(userId, !current);
    setActionUserId(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <GoldInput
            placeholder="Search by name, email or phone…"
            icon={<Search size={16} />}
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => handleFilter(s)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                statusFilter === s
                  ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <p className="text-sm text-zinc-500">
        Showing <span className="text-white">{users.length}</span> of{" "}
        <span className="text-white">{total}</span> users
      </p>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["User", "Email", "Phone", "Account", "KYC", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-xs font-bold text-black">
                        {user.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.divaProfile?.accountStatus ?? "PENDING_VERIFICATION"} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.divaKYC?.status ?? "PENDING"} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/diva-app-admin/users/${user.id}`}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.05] hover:text-[#D4AF37]"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => toggleActive(user.id, user.isActive)}
                        disabled={actionUserId === user.id}
                        className={`rounded-lg p-1.5 transition-all hover:bg-white/[0.05] ${
                          user.isActive ? "text-zinc-500 hover:text-red-400" : "text-zinc-500 hover:text-emerald-400"
                        }`}
                      >
                        {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-600">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 rounded-lg text-sm transition-all ${
                p === currentPage
                  ? "bg-[#D4AF37] text-black font-medium"
                  : "border border-white/10 text-zinc-500 hover:border-white/20 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
