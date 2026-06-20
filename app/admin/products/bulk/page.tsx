"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, Download, CheckCircle, XCircle, ArrowLeft, AlertCircle } from "lucide-react";

type ProductRow = {
  name: string;
  slug: string;
  category: string;
  basePrice: string;
  deliveryDays: string;
  description: string;
  isActive: string;
  isFeatured: string;
  status?: "pending" | "success" | "error";
  error?: string;
};

const CSV_TEMPLATE = `name,slug,category,basePrice,deliveryDays,description,isActive,isFeatured
Custom Photo Frame,custom-photo-frame,photo-gifts,599,5,Beautiful personalized photo frame,true,true
House Name Plate,house-name-plate,home-decor,799,7,Premium name plate for your home,true,false
Photo Coffee Mug,photo-coffee-mug,photo-gifts,399,4,Custom printed coffee mug,true,true`;

const CATEGORY_SLUGS = [
  "photo-gifts",
  "home-decor",
  "personalized-gifts",
  "corporate-gifts",
  "event-gifts",
];

function parseCSV(text: string): ProductRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row as unknown as ProductRow;
  });
}

export default function BulkUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed.map((r) => ({ ...r, status: "pending" })));
      setDone(false);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shivradium_products_template.csv";
    a.click();
  }

  async function importProducts() {
    setImporting(true);
    const updated = [...rows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      try {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            slug: row.slug || row.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            categorySlug: row.category,
            basePrice: parseFloat(row.basePrice) || 0,
            deliveryDays: parseInt(row.deliveryDays) || 5,
            description: row.description || "",
            isActive: row.isActive !== "false",
            isFeatured: row.isFeatured === "true",
            fields: [],
            _bulk: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        updated[i] = { ...row, status: "success" };
      } catch (err) {
        updated[i] = { ...row, status: "error", error: (err as Error).message };
      }
      setRows([...updated]);
    }

    setImporting(false);
    setDone(true);
  }

  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 mb-2">CSV Format Guide</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Required columns: <code className="bg-blue-100 px-1 rounded">name, slug, category, basePrice</code></p>
              <p>Optional columns: <code className="bg-blue-100 px-1 rounded">deliveryDays, description, isActive, isFeatured</code></p>
              <p>Category values: <code className="bg-blue-100 px-1 rounded">{CATEGORY_SLUGS.join(", ")}</code></p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 font-medium py-4 rounded-2xl transition-colors"
        >
          <Download className="w-5 h-5" />
          Download CSV Template
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-4 rounded-2xl transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload CSV File
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Preview Table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900">{rows.length} products ready to import</p>
            {done && (
              <p className="text-sm">
                <span className="text-green-600 font-medium">{successCount} success</span>
                {errorCount > 0 && <span className="text-red-500 font-medium ml-2">{errorCount} failed</span>}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Delivery</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr key={i} className={row.status === "error" ? "bg-red-50" : row.status === "success" ? "bg-green-50" : ""}>
                    <td className="px-4 py-3">
                      {row.status === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {row.status === "error" && (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-500">{row.error}</span>
                        </div>
                      )}
                      {row.status === "pending" && <span className="w-4 h-4 rounded-full border-2 border-gray-300 inline-block" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500">{row.category}</td>
                    <td className="px-4 py-3 text-gray-900">₹{row.basePrice}</td>
                    <td className="px-4 py-3 text-gray-500">{row.deliveryDays}d</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${row.isActive !== "false" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {row.isActive !== "false" ? "Active" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Button */}
      {rows.length > 0 && !done && (
        <button
          onClick={importProducts}
          disabled={importing}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
        >
          {importing ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Importing... ({rows.filter(r => r.status !== "pending").length}/{rows.length})
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Import {rows.length} Products
            </>
          )}
        </button>
      )}

      {done && (
        <div className="flex gap-3">
          <Link href="/admin/products" className="flex-1 bg-gray-900 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors hover:bg-gray-800">
            View All Products
          </Link>
          <button
            onClick={() => { setRows([]); setDone(false); }}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl transition-colors hover:bg-gray-50"
          >
            Upload More
          </button>
        </div>
      )}
    </div>
  );
}
