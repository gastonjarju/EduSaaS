"use client";

// Client forms for the join flow (screen 1c). The server decides which step
// to show; these only submit and display errors.
import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/alumni/actions";
import { PHONE_COUNTRIES } from "@/lib/alumni/phoneCountries";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const input = "h-12 w-full rounded-md bg-placeholder px-3";
const primary = "h-12 w-full rounded-md bg-ink px-5 font-semibold text-white disabled:opacity-60";

function ErrorText({ state }: { state: ActionState }) {
  return (
    <p role="alert" className="min-h-5 text-sm text-amber">
      {state.error}
    </p>
  );
}

export function StepIndicator({ step }: { step: 1 | 2 }) {
  const dot = (n: 1 | 2, label: string) => (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${n <= step ? "bg-accent" : "bg-placeholder-strong"}`}
      >
        {n}
      </span>
      <span className={n === step ? "font-semibold" : "text-ink-soft"}>{label}</span>
    </li>
  );
  return (
    <ol className="flex items-center gap-3 text-sm" aria-label={`Step ${step} of 2`}>
      {dot(1, "Verify identity")}
      <li aria-hidden className="h-px flex-1 bg-line" />
      {dot(2, "Your profile")}
    </ol>
  );
}

// Country-code picker: shows "🇬🇲 +220 ▾" while closed; the native list
// (transparent select on top) shows full country names.
function CountryPicker({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  const selected = PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
  return (
    <div className="relative h-12 flex-none">
      <span
        aria-hidden
        className="flex h-full items-center gap-1 rounded-md bg-placeholder px-3 whitespace-nowrap"
      >
        {selected.flag} +{selected.dial} <span className="text-ink-soft">▾</span>
      </span>
      <select
        name="phoneCountry"
        aria-label="Country code"
        defaultValue={initial}
        onChange={(e) => setCode(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name} (+{c.dial})
          </option>
        ))}
      </select>
    </div>
  );
}

export function ContactStep({ action, defaultCountry }: { action: Action; defaultCountry: string }) {
  const [kind, setKind] = useState<"phone" | "email">("phone");
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div role="radiogroup" aria-label="Verify with" className="grid grid-cols-2 gap-2">
        {(["phone", "email"] as const).map((k) => (
          <label
            key={k}
            className={`flex h-12 cursor-pointer items-center justify-center rounded-md border font-semibold ${kind === k ? "border-accent bg-accent-soft text-accent-ink" : "border-line-strong bg-white"}`}
          >
            <input
              type="radio"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
              className="sr-only"
            />
            {k === "phone" ? "Phone" : "Email"}
          </label>
        ))}
      </div>
      {kind === "phone" ? (
        <div className="space-y-1">
          <label htmlFor="contact" className="text-sm text-ink-soft">
            Phone number
          </label>
          <div className="flex gap-2">
            <CountryPicker
              // React resets the form after each submit; remounting with the
              // submitted country as the default keeps the user's choice.
              key={state.country ?? "initial"}
              initial={state.country ?? defaultCountry}
            />
            <input
              key="phone"
              id="contact"
              name="contact"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Number"
              defaultValue={state.content}
              className={`${input} min-w-0`}
            />
          </div>
          <p className="text-xs text-ink-soft">Living abroad? Pick your country, or type the number with + and the country code.</p>
        </div>
      ) : (
        <label className="block space-y-1">
          <span className="text-sm text-ink-soft">Email address</span>
          <input
            key="email"
            name="contact"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.content}
            className={input}
          />
        </label>
      )}
      <ErrorText state={state} />
      <button disabled={pending} className={primary}>
        {pending ? "Sending…" : kind === "phone" ? "Send code via SMS" : "Send code by email"}
      </button>
    </form>
  );
}

export function CodeStep({
  action,
  restart,
  sentTo,
  hint,
}: {
  action: Action;
  restart: () => Promise<void>;
  sentTo: string;
  hint?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm text-ink-soft">Enter the code we sent to {sentTo}</span>
          <input
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={8}
            placeholder="_ _ _ _"
            className={`${input} text-center text-2xl tracking-[0.5em]`}
          />
        </label>
        {hint && <p className="text-sm text-amber">{hint}</p>}
        <ErrorText state={state} />
        <button disabled={pending} className={primary}>
          {pending ? "Checking…" : "Verify & continue"}
        </button>
      </form>
      <form action={restart}>
        <button className="h-12 w-full text-ink-soft underline">Use a different phone or email</button>
      </form>
    </div>
  );
}

export function ProfileStep({ action, years }: { action: Action; years: number[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-placeholder text-sm text-ink-soft">
          + photo
        </span>
        <span className="text-sm text-ink-soft">Photo upload is coming soon.</span>
      </div>
      <label className="block space-y-1">
        <span className="text-sm text-ink-soft">Full name</span>
        <input name="name" required minLength={2} maxLength={100} autoComplete="name" className={input} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-ink-soft">Graduation year</span>
        <select name="graduationYear" required defaultValue="" className={input}>
          <option value="" disabled>
            Select…
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-ink-soft">Current role (optional)</span>
        <input name="profession" maxLength={150} placeholder="e.g. Teacher" className={input} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-ink-soft">City (optional)</span>
        <input name="city" maxLength={120} autoComplete="address-level2" className={input} />
      </label>
      <ErrorText state={state} />
      <button disabled={pending} className={primary}>
        {pending ? "Joining…" : "Join directory"}
      </button>
    </form>
  );
}
