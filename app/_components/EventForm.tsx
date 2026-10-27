"use client";

import { useActionState, useState } from "react";
import type { EventFormState } from "@/lib/alumni/eventActions";

export type EventFormValues = {
  title: string;
  startsAt: string; // "2026-12-20T16:00" in the school's time zone
  endsAt: string;
  locationType: "physical" | "virtual" | "hybrid";
  location: string;
  virtualLink: string;
  description: string;
};

type Props = {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial: EventFormValues;
  mode: "create" | "edit";
  isPublished: boolean;
  timeZoneLabel: string;
};

const input = "h-12 w-full rounded-md bg-placeholder px-3";
const label = "block space-y-1";
const hint = "text-sm text-ink-soft";
const PLACES = [
  { value: "physical", label: "In person" },
  { value: "virtual", label: "Online" },
  { value: "hybrid", label: "Both" },
] as const;

// Admin create/edit form for an event (admin Events screen).
export default function EventForm(props: Props) {
  const [state, formAction, pending] = useActionState(props.action, {});
  // Remount after each response so fields show what was submitted (React
  // resets uncontrolled forms after an action).
  return <Fields key={state.attempt ?? "initial"} {...props} state={state} formAction={formAction} pending={pending} />;
}

function Fields({
  initial,
  mode,
  isPublished,
  timeZoneLabel,
  state,
  formAction,
  pending,
}: Props & { state: EventFormState; formAction: (fd: FormData) => void; pending: boolean }) {
  const v = { ...initial, ...(state.values as Partial<EventFormValues> | undefined) };
  const [place, setPlace] = useState<EventFormValues["locationType"]>(v.locationType || "physical");

  return (
    <form action={formAction} className="space-y-4">
      <label className={label}>
        <span className={hint}>Title</span>
        <input name="title" required maxLength={200} defaultValue={v.title} placeholder="e.g. Homecoming Reunion" className={input} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          <span className={hint}>Starts</span>
          <input name="startsAt" type="datetime-local" required defaultValue={v.startsAt} className={input} />
        </label>
        <label className={label}>
          <span className={hint}>Ends (optional)</span>
          <input name="endsAt" type="datetime-local" defaultValue={v.endsAt} className={input} />
        </label>
      </div>
      <p className="-mt-2 text-xs text-ink-soft">Times are in the school&apos;s time zone ({timeZoneLabel}).</p>

      <fieldset className="space-y-1">
        <legend className={hint}>Where</legend>
        <div className="grid grid-cols-3 gap-2">
          {PLACES.map((p) => (
            <label
              key={p.value}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-md border font-semibold ${place === p.value ? "border-accent bg-accent-soft text-accent-ink" : "border-line-strong bg-white"}`}
            >
              <input
                type="radio"
                name="locationType"
                value={p.value}
                checked={place === p.value}
                onChange={() => setPlace(p.value)}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      {place !== "virtual" && (
        <label className={label}>
          <span className={hint}>Location</span>
          <input name="location" required maxLength={255} defaultValue={v.location} placeholder="e.g. Lamin campus" className={input} />
        </label>
      )}
      {place !== "physical" && (
        <label className={label}>
          <span className={hint}>Online link</span>
          <input
            name="virtualLink"
            type="url"
            required
            maxLength={500}
            defaultValue={v.virtualLink}
            placeholder="https://zoom.us/j/…"
            className={input}
          />
          <span className="block text-xs text-ink-soft">Only shown to signed-in alumni.</span>
        </label>
      )}

      <label className={label}>
        <span className={hint}>Description (optional)</span>
        <textarea name="description" rows={4} maxLength={5000} defaultValue={v.description} className="w-full rounded-md bg-placeholder p-3" />
      </label>

      <p role="status" className="min-h-5 text-sm">
        {state.error ? <span className="text-amber">{state.error}</span> : <span className="text-accent-ink">{state.message}</span>}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        {mode === "create" ? (
          <>
            <button name="intent" value="draft" disabled={pending} className="h-12 w-full sm:w-auto sm:flex-1 rounded-md border border-line-strong bg-white px-5 font-semibold disabled:opacity-60">
              Save draft
            </button>
            <button name="intent" value="publish" disabled={pending} className="h-12 w-full sm:w-auto sm:flex-1 rounded-md bg-accent px-5 font-semibold text-white disabled:opacity-60">
              Publish
            </button>
          </>
        ) : (
          <>
            <button name="intent" value="save" disabled={pending} className="h-12 w-full sm:w-auto sm:flex-1 rounded-md bg-ink px-5 font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save changes"}
            </button>
            {isPublished ? (
              <button name="intent" value="draft" disabled={pending} className="h-12 w-full sm:w-auto sm:flex-1 rounded-md border border-line-strong bg-white px-5 font-semibold disabled:opacity-60">
                Unpublish
              </button>
            ) : (
              <button name="intent" value="publish" disabled={pending} className="h-12 w-full sm:w-auto sm:flex-1 rounded-md bg-accent px-5 font-semibold text-white disabled:opacity-60">
                Publish
              </button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
