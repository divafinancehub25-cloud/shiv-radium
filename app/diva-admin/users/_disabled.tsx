"use client";
import { useState, useEffect, useCallback } from "react";
import { listUsers } from "@/actions/diva/admin";
import { UsersTable } from "@/components/diva/admin/users-table";
import type { AdminUserRow } from "@/types/diva";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const data = await listUsers({ search, status, page });
    setUsers(data.users as AdminUserRow[]);
    setTotal(data.total);
    setPages(data.pages);
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <UsersTable users={users} total={total} pages={pages} currentPage={page}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onStatusFilter={(s) => { setStatus(s); setPage(1); }}
        onPageChange={setPage} />
    </div>
  );
}
