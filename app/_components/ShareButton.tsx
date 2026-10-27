"use client";

import { useState, useSyncExternalStore } from "react";

type Props = { url: string; title: string; text: string };

// Read once on the client; on the server (and first paint) assume no share sheet.
const subscribe = () => () => {};
const canShareNatively = () => typeof navigator.share === "function";

// Event sharing. "Copy link" is always available — some share sheets (e.g.
// macOS) have no copy option. "Share" opens the device's share sheet
// (WhatsApp, SMS, email…) where the browser has one.
export default function ShareButton({ url, title, text }: Props) {
  const hasShareSheet = useSyncExternalStore(subscribe, canShareNatively, () => false);
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("manual"); // clipboard blocked: show the link to copy by hand
    }
  }

  async function share() {
    try {
      await navigator.share({ title, text, url });
    } catch (err) {
      if ((err as Error).name !== "AbortError") await copy(); // closed the sheet → do nothing
    }
  }

  const button = "flex h-12 flex-1 items-center justify-center rounded-md px-5 font-semibold";
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {hasShareSheet && (
          <button type="button" onClick={share} className={`${button} bg-accent text-white`}>
            Share
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={`${button} ${hasShareSheet ? "border border-line-strong bg-white" : "bg-accent text-white"}`}
        >
          Copy link
        </button>
      </div>
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
