"use client";

import { useActionState, useOptimistic } from "react";
import type { ActionState } from "@/lib/alumni/actions";
import type { RsvpStatus } from "@/lib/alumni/events";

const OPTIONS: { status: RsvpStatus; label: string; active: string }[] = [
  { status: "going", label: "Going", active: "bg-accent text-white border-accent" },
  { status: "maybe", label: "Maybe", active: "bg-amber-soft text-amber border-amber" },
  { status: "not_going", label: "Can't go", active: "bg-placeholder-strong text-ink border-line-strong" },
];

type Props = {
  current: RsvpStatus | null;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

// RSVP on screen 1g. The chosen button lights up immediately; counts update
// when the server action refreshes the page.
export default function RsvpButtons({ current, action }: Props) {
  const [shown, setShown] = useOptimistic(current);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      setShown(formData.get("status") as RsvpStatus);
      return action(prev, formData);
    },
    {}
  );
  const label = OPTIONS.find((o) => o.status === shown)?.label;

  return (
    <form action={formAction} className="space-y-2">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="RSVP">
        {OPTIONS.map((o) => (
          <button
            key={o.status}
            name="status"
            value={o.status}
            aria-pressed={shown === o.status}
            disabled={pending}
            className={`h-12 rounded-md border font-semibold ${shown === o.status ? o.active : "border-line-strong bg-white"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" className="text-sm">
        {state.error ? (
          <span className="text-amber">{state.error}</span>
        ) : state.ok && label ? (
          <span className="text-accent-ink">✓ RSVP saved: {label}</span>
        ) : null}
      </p>
    </form>
  );
}
