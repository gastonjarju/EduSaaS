"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import type { PhotoState } from "@/lib/alumni/profileActions";
import { Avatar } from "./alumni";

type Props = {
  name: string;
  photo: string | null;
  upload: (prev: PhotoState, formData: FormData) => Promise<PhotoState>;
  remove: () => Promise<void>;
};

const isHeic = (f: File) => /^image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

/**
 * iPhone photos are often HEIC, which Chrome/Firefox can't decode and our
 * server image library can't either (no HEVC decoder). Convert to JPEG in the
 * browser with heic-to (libheif in WebAssembly, ~3 MB), which is only
 * downloaded when a HEIC file is picked.
 */
async function heicToJpeg(file: File): Promise<File> {
  const { heicTo } = await import("heic-to/next");
  const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
  return new File([jpeg], "photo.jpg", { type: "image/jpeg" });
}

/**
 * Shrinks a photo in the browser before upload (largest side 1024px, JPEG),
 * so phones send ~200 KB instead of several MB. Falls back to the original
 * file if the browser can't decode it (e.g. HEIC in Chrome); the server
 * converts it either way.
 */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

// Profile photo: choose a file and it uploads straight away; or remove it.
export default function PhotoUploader({ name, photo, upload, remove }: Props) {
  const [state, uploadAction, uploading] = useActionState(upload, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  async function onChoose(e: React.ChangeEvent<HTMLInputElement>) {
    let file = e.target.files?.[0];
    e.target.value = ""; // choosing the same file again re-uploads
    if (!file) return;
    setConvertError(null);
    if (isHeic(file)) {
      setConverting(true);
      try {
        file = await heicToJpeg(file);
      } catch {
        setConvertError("This iPhone photo couldn't be converted. Try a JPEG or PNG, or a screenshot of the photo.");
        return;
      } finally {
        setConverting(false);
      }
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.set("photo", await shrink(file));
    // Dispatched from code, not a form submit, so it needs a transition
    startTransition(() => uploadAction(fd));
  }

  const busy = uploading || converting;
  const shown = uploading ? preview : photo;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className={uploading ? "opacity-60" : ""}>
        <Avatar name={name} size="lg" photo={shown} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {/* Without JavaScript this form posts the original file */}
          <form action={uploadAction}>
            <label className="flex h-12 cursor-pointer items-center rounded-md bg-ink px-4 font-semibold text-white">
              {converting ? "Converting…" : uploading ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={onChoose}
                disabled={busy}
                className="sr-only"
              />
            </label>
            <noscript>
              <button className="mt-2 h-12 rounded-md border border-line-strong px-4 font-semibold">Save photo</button>
            </noscript>
          </form>
          {photo && !busy && (
            <button
              type="button"
              disabled={removing}
              onClick={() => startRemove(() => remove())}
              className="h-12 rounded-md border border-line-strong bg-white px-4 font-semibold disabled:opacity-50"
            >
              {removing ? "Removing…" : "Remove photo"}
            </button>
          )}
        </div>
        <p role="status" className="text-sm">
          {convertError || state.error ? (
            <span className="text-amber">{convertError ?? state.error}</span>
          ) : state.ok && !uploading ? (
            <span className="text-accent-ink">✓ Photo updated.</span>
          ) : (
            <span className="text-ink-soft">JPEG, PNG or iPhone (HEIC) photo. It&apos;s cropped to a square.</span>
          )}
        </p>
      </div>
    </div>
  );
}
