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

  async function onChoose(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.set("photo", await shrink(file));
    // Dispatched from code, not a form submit, so it needs a transition
    startTransition(() => uploadAction(fd));
    e.target.value = ""; // choosing the same file again re-uploads
  }

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
              {uploading ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={onChoose}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            <noscript>
              <button className="mt-2 h-12 rounded-md border border-line-strong px-4 font-semibold">Save photo</button>
            </noscript>
          </form>
          {photo && !uploading && (
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
          {state.error ? (
            <span className="text-amber">{state.error}</span>
          ) : state.ok && !uploading ? (
            <span className="text-accent-ink">✓ Photo updated.</span>
          ) : (
            <span className="text-ink-soft">JPEG or PNG. It&apos;s cropped to a square.</span>
          )}
        </p>
      </div>
    </div>
  );
}
