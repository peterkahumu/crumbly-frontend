import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Uploads to /api/upload and reports back URLs via onChange.
 * `multiple` controls whether `value`/`onChange` deal with an array of URLs
 * (cake photos) or a single URL string (logo/cover/portfolio image).
 */
export default function ImageUploader({ value, onChange, multiple = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const urls = multiple ? value || [] : value ? [value] : [];

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Upload failed");
        uploaded.push(body.url);
      }
      if (multiple) {
        onChange([...(value || []), ...uploaded]);
      } else {
        onChange(uploaded[0]);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index) {
    if (multiple) {
      onChange((value || []).filter((_, i) => i !== index));
    } else {
      onChange("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={url + i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-cream-300 bg-cream-100">
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {(multiple || urls.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cream-300 text-cocoa-400 hover:border-terracotta-300 hover:text-terracotta-500"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-[11px]">{uploading ? "Uploading…" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
