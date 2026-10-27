"use client";

import { useState } from "react";

type Props = { url: string; title: string; text: string };

// "Share": opens the device's share sheet (WhatsApp, SMS, email…) where the
// browser supports it, otherwise copies the link. The link is also shown so
// it can be copied by hand if the clipboard isn't available.
export default function ShareButton({ url, title, text }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // user closed the sheet
        // Otherwise fall through to copying the link
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={share}
        className="flex h-12 w-full items-center justify-center rounded-md bg-accent px-5 font-semibold text-white"
      >
        Share
      </button>
      {status !== "idle" && (
        <div className="space-y-1">
          <p role="status" className="text-sm text-accent-ink">
            {status === "copied" ? "✓ Link copied — paste it anywhere to share." : "Copy this link to share:"}
          </p>
          <input
            readOnly
            value={url}
            aria-label="Event link"
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 w-full rounded-md bg-placeholder px-3 text-sm"
          />
        </div>
      )}
    </div>
  );
}
