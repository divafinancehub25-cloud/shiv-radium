"use client";

import { useState } from "react";
import { UsersTable } from "@/components/diva/admin/users-table";

export default function DivaAdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Members</h1>
      <UsersTable
        users={[]}
        total={0}
        pages={1}
        currentPage={page}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onPageChange={setPage}
      />
    </div>
  );
}
