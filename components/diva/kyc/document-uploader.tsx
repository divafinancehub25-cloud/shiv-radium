"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Server stores files inline (base64) when cloud storage isn't configured,
// which caps at ~4MB. Phone photos are often larger, so shrink images in the
// browser before upload — resize to max 1600px and re-encode as JPEG. This
// keeps uploads reliably under the limit regardless of storage config.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file; // PDFs pass through untouched
  try {
    const bitmap = await createImageBitmap(file);
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file; // if anything goes wrong, fall back to the original file
  }
}

type Props = {
  label: string;
  accept?: string[];
  onUploaded: (url: string, fileName: string) => void;
  value?: { url: string; fileName: string } | null;
};

export function DocumentUploader({ label, accept = ["image/*", "application/pdf"], onUploaded, value }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (files: File[]) => {
      const raw = files[0];
      if (!raw) return;
      setError("");
      setUploading(true);

      const file = await compressImage(raw);

      // Guard against large PDFs that can't be shrunk in the browser.
      if (file.size > 4 * 1024 * 1024) {
        setUploading(false);
        setError("File too large — please upload a photo, or a PDF under 4MB");
        return;
      }

      const fd = new FormData();
      fd.append("file", file);

      let data: { url?: string; fileName?: string; error?: string } = {};
      try {
        const res = await fetch("/api/diva/kyc/upload", { method: "POST", body: fd });
        data = await res.json();
        setUploading(false);
        if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      } catch {
        setUploading(false);
        setError("Upload failed — please check your connection and try again");
        return;
      }
      onUploaded(data.url ?? "", data.fileName ?? "");
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, t) => ({ ...acc, [t]: [] }), {}),
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-400">{label}</p>
            <p className="text-xs text-emerald-400/70 truncate max-w-48">{value.fileName}</p>
          </div>
        </div>
        <button onClick={() => onUploaded("", "")} className="text-zinc-500 hover:text-red-400">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all",
          isDragActive
            ? "border-[#D4AF37]/60 bg-[#D4AF37]/5"
            : "border-white/10 hover:border-[#D4AF37]/30 hover:bg-white/[0.02]"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        ) : (
          <Upload className="h-8 w-8 text-zinc-600" />
        )}
        <div>
          <p className="text-sm text-zinc-400">
            {uploading ? "Uploading..." : "Drop file here or click to upload"}
          </p>
          <p className="text-xs text-zinc-600">JPG, PNG, PDF — photos auto-compressed</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
