"use client";

import { useEffect, useRef, useState } from "react";
import { REJECT_CONFIRM_OVER } from "@/lib/alumni/reviewRules";

type Props = {
  formId: string; // the bulk form; row checkboxes use form={formId}
  pageCount: number; // rows on this page
  total: number; // rows in this tab (all pages)
  canVerify: boolean;
  canReject: boolean;
};

const rowBoxes = (formId: string) =>
  Array.from(document.querySelectorAll<HTMLInputElement>(`input[form="${formId}"][name="profileIds"]`));

// Selection bar for the admin Alumni list: "Select all", a count, and bulk
// Verify / Reject. Row checkboxes and these buttons belong to one form, so
// it also works without JavaScript (tick boxes, press a button).
export default function BulkReviewBar({ formId, pageCount, total, canVerify, canReject }: Props) {
  const [selected, setSelected] = useState(0);
  const [allMatching, setAllMatching] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [confirming, setConfirming] = useState(false); // large-reject confirmation open
  const selectAll = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => {
      const checked = rowBoxes(formId).filter((b) => b.checked).length;
      setSelected(checked);
      setHydrated(true);
      setConfirming(false); // selection changed: ask again
      if (checked < pageCount) setAllMatching(false);
      if (selectAll.current) {
        selectAll.current.checked = checked > 0 && checked === pageCount;
        selectAll.current.indeterminate = checked > 0 && checked < pageCount;
      }
    };
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.name === "profileIds" && t.getAttribute("form") === formId) sync();
    };
    document.addEventListener("change", onChange);
    // Run once after mount (e.g. the browser restored ticked boxes)
    const id = requestAnimationFrame(sync);
    return () => {
      document.removeEventListener("change", onChange);
      cancelAnimationFrame(id);
    };
  }, [formId, pageCount]);

  function toggleAll(checked: boolean) {
    for (const b of rowBoxes(formId)) b.checked = checked;
    setSelected(checked ? pageCount : 0);
    setConfirming(false);
    if (!checked) setAllMatching(false);
    if (selectAll.current) selectAll.current.indeterminate = false;
  }

  const count = allMatching ? total : selected;
  // Before hydration (or without JS) the buttons stay enabled; the server
  // ignores an empty selection.
  const disabled = hydrated && count === 0;
  const button = "h-12 flex-1 whitespace-nowrap rounded-md px-4 font-semibold disabled:opacity-50 sm:flex-none";
  const suffix = count > 0 ? ` (${count})` : "";
  const needsConfirm = hydrated && count > REJECT_CONFIRM_OVER;

  return (
    <div className="space-y-2 rounded-xl border border-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-12 cursor-pointer items-center gap-2 px-1">
          <input
            ref={selectAll}
            type="checkbox"
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
          <span className="font-semibold">Select all</span>
        </label>
        <span className="text-sm text-ink-soft" role="status">
          {count > 0 ? `${count} selected` : "Tick alumni to verify or reject them together."}
        </span>
        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          {canVerify && (
            <button form={formId} name="decision" value="verified" disabled={disabled} className={`${button} bg-accent text-white`}>
              Verify<span className="hidden sm:inline"> selected</span>
              {suffix}
            </button>
          )}
          {canReject &&
            (needsConfirm ? (
              // Over the limit: open the confirmation instead of submitting
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-expanded={confirming}
                className={`${button} border border-line-strong bg-white`}
              >
                Reject<span className="hidden sm:inline"> selected</span>
                {suffix}
              </button>
            ) : (
              <button form={formId} name="decision" value="rejected" disabled={disabled} className={`${button} border border-line-strong bg-white`}>
                Reject<span className="hidden sm:inline"> selected</span>
                {suffix}
              </button>
            ))}
        </div>
      </div>
      {selected === pageCount && pageCount > 0 && total > pageCount && (
        <p className="text-sm">
          {allMatching ? (
            <>
              All <strong>{total}</strong> in this tab are selected.{" "}
              <button type="button" onClick={() => toggleAll(false)} className="text-accent-ink underline">
                Clear selection
              </button>
            </>
          ) : (
            <>
              All {pageCount} on this page are selected.{" "}
              <button
                type="button"
                onClick={() => {
                  setAllMatching(true);
                  setConfirming(false);
                }}
                className="text-accent-ink underline"
              >
                Select all {total} in this tab
              </button>
            </>
          )}
        </p>
      )}
      {confirming && needsConfirm && (
        <div role="alertdialog" aria-label="Confirm rejection" className="space-y-3 rounded-lg bg-amber-soft p-3 text-ink">
          <p>
            <strong>Reject {count} alumni?</strong> They&apos;ll be hidden from the directory and lose access until you
            verify them again.
          </p>
          <div className="flex gap-2">
            <input type="hidden" name="confirmed" value="1" form={formId} />
            <button form={formId} name="decision" value="rejected" className={`${button} bg-ink text-white`}>
              Yes, reject {count}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={`${button} border border-line-strong bg-white`}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {canReject && (
        // Without JavaScript there's no confirmation step, so ask for a tick instead
        <noscript>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirmed" value="1" form={formId} className="h-5 w-5" />
            I confirm rejecting more than {REJECT_CONFIRM_OVER} alumni at once
          </label>
        </noscript>
      )}
      {allMatching && <input type="hidden" name="allMatching" value="1" form={formId} />}
    </div>
  );
}
