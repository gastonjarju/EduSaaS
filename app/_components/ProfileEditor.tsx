"use client";

import { useActionState, useState } from "react";
import type { ProfileFormState } from "@/lib/alumni/profileActions";
import { ACTIVITY_SUGGESTIONS, INDUSTRIES, LIMITS, MENTOR_AREAS } from "@/lib/alumni/profileFields";

export type ProfileValues = {
  name: string;
  classSection: string;
  currentCity: string;
  bio: string;
  profession: string;
  employer: string;
  industry: string;
  studying: string;
  linkedinUrl: string;
  isMentor: boolean;
  mentorAreas: string[];
  activities: string[];
  memories: string[];
  visible: string[]; // privacy fields shown to other alumni
};

type Props = {
  action: (prev: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  initial: ProfileValues;
  graduationYear: number;
};

const PRIVACY_LABELS: [field: string, label: string][] = [
  ["photo", "Photo"],
  ["city", "City"],
  ["profession", "Job title and industry"],
  ["employer", "Employer"],
  ["studying", "What I'm studying"],
  ["bio", "About me"],
  ["linkedin", "LinkedIn"],
  ["activities", "School activities"],
  ["memories", "Memories"],
];

const input = "h-12 w-full rounded-md bg-placeholder px-3";
const hint = "text-sm text-ink-soft";
const card = "space-y-4 rounded-xl border border-line bg-white p-5";
const heading = "text-lg font-bold";

/** Values echoed back after an error override the initial ones. */
function merge(initial: ProfileValues, echoed?: Record<string, string | string[]>): ProfileValues {
  if (!echoed) return initial;
  const str = (k: string) => (typeof echoed[k] === "string" ? (echoed[k] as string) : "");
  const arr = (k: string) => (Array.isArray(echoed[k]) ? (echoed[k] as string[]) : []);
  return {
    name: str("name"),
    classSection: str("classSection"),
    currentCity: str("currentCity"),
    bio: str("bio"),
    profession: str("profession"),
    employer: str("employer"),
    industry: str("industry"),
    studying: str("studying"),
    linkedinUrl: str("linkedinUrl"),
    isMentor: str("isMentor") === "on",
    mentorAreas: arr("mentorAreas"),
    activities: arr("activities"),
    memories: arr("memories"),
    visible: arr("visible"),
  };
}

// Edit profile form. Remounts after each save so fields show the saved (or,
// after an error, the submitted) values.
export default function ProfileEditor(props: Props) {
  const [state, formAction, pending] = useActionState(props.action, {});
  return (
    <Fields
      key={state.attempt ?? "initial"}
      values={merge(props.initial, state.values)}
      graduationYear={props.graduationYear}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}

function Fields({
  values: v,
  graduationYear,
  state,
  formAction,
  pending,
}: {
  values: ProfileValues;
  graduationYear: number;
  state: ProfileFormState;
  formAction: (fd: FormData) => void;
  pending: boolean;
}) {
  const [isMentor, setIsMentor] = useState(v.isMentor);
  return (
    <form action={formAction} className="space-y-4">
      <section className={card}>
        <h2 className={heading}>About you</h2>
        <label className="block space-y-1">
          <span className={hint}>Full name</span>
          <input name="name" required minLength={2} maxLength={100} defaultValue={v.name} className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={hint}>Class / form (optional)</span>
            <input name="classSection" maxLength={100} defaultValue={v.classSection} placeholder="e.g. Form 5A" className={input} />
          </label>
          <label className="block space-y-1">
            <span className={hint}>City</span>
            <input name="currentCity" maxLength={120} defaultValue={v.currentCity} className={input} />
          </label>
        </div>
        <p className={hint}>
          Graduation year: <strong>{graduationYear}</strong>. To change it, contact the school.
        </p>
        <label className="block space-y-1">
          <span className={hint}>About me (optional)</span>
          <textarea name="bio" rows={3} maxLength={1000} defaultValue={v.bio} className="w-full rounded-md bg-placeholder p-3" />
        </label>
      </section>

      <section className={card}>
        <h2 className={heading}>Current profession</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={hint}>Job title</span>
            <input name="profession" maxLength={150} defaultValue={v.profession} placeholder="e.g. Nurse" className={input} />
          </label>
          <label className="block space-y-1">
            <span className={hint}>Employer</span>
            <input name="employer" maxLength={150} defaultValue={v.employer} placeholder="e.g. Banjul Hospital" className={input} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className={hint}>Industry</span>
          <select name="industry" defaultValue={v.industry} className={`${input} pr-10`}>
            <option value="">Choose…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className={hint}>Currently studying (optional)</span>
          <input name="studying" maxLength={200} defaultValue={v.studying} placeholder="e.g. BSc Nursing, University of The Gambia" className={input} />
        </label>
        <label className="block space-y-1">
          <span className={hint}>LinkedIn profile URL (optional)</span>
          <input name="linkedinUrl" type="text" inputMode="url" autoCapitalize="none" maxLength={200} defaultValue={v.linkedinUrl} placeholder="https://www.linkedin.com/in/your-name" className={input} />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center gap-3">
          <input type="checkbox" name="isMentor" checked={isMentor} onChange={(e) => setIsMentor(e.target.checked)} className="h-5 w-5 accent-accent" />
          <span className="font-semibold">I&apos;m open to mentoring students and younger alumni</span>
        </label>
        {isMentor && (
          <fieldset className="grid gap-2 pl-8 sm:grid-cols-2">
            <legend className={`${hint} mb-1`}>I can help with</legend>
            {MENTOR_AREAS.map((a) => (
              <label key={a.value} className="flex min-h-10 cursor-pointer items-center gap-2">
                <input type="checkbox" name="mentorAreas" value={a.value} defaultChecked={v.mentorAreas.includes(a.value)} className="h-5 w-5 accent-accent" />
                {a.label}
              </label>
            ))}
          </fieldset>
        )}
      </section>

      <section className={card}>
        <h2 className={heading}>Activities at school</h2>
        <p className={hint}>Clubs, sports, roles — anything classmates might remember you for.</p>
        <TagInput initial={v.activities} />
      </section>

      <section className={card}>
        <h2 className={heading}>Memories from school</h2>
        <p className={hint}>Up to {LIMITS.memories} short memories.</p>
        <MemoriesInput initial={v.memories} />
      </section>

      <section className={card}>
        <h2 className={heading}>Who can see what</h2>
        <p className={hint}>
          Your name and class are always visible to other alumni of the school. Untick anything you&apos;d rather keep to
          yourself; school admins can still see it.
        </p>
        <div className="grid gap-1 sm:grid-cols-2">
          {PRIVACY_LABELS.map(([field, label]) => (
            <label key={field} className="flex min-h-10 cursor-pointer items-center gap-2">
              <input type="checkbox" name="visible" value={field} defaultChecked={v.visible.includes(field)} className="h-5 w-5 accent-accent" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <button disabled={pending} className="h-12 rounded-md bg-accent px-6 font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save profile"}
        </button>
        <p role="status" className="text-sm">
          {state.error ? <span className="text-amber">{state.error}</span> : <span className="text-accent-ink">{state.message}</span>}
        </p>
      </div>
    </form>
  );
}

// Tags: type and press Enter (or comma), or tap a suggestion. Submitted as
// repeated hidden "activities" inputs.
function TagInput({ initial }: { initial: string[] }) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");
  const full = tags.length >= LIMITS.activities;
  const has = (t: string) => tags.some((x) => x.toLowerCase() === t.toLowerCase());

  function add(raw: string) {
    const tag = raw.replace(/\s+/g, " ").trim().slice(0, LIMITS.activityLength);
    if (tag && !has(tag) && !full) setTags([...tags, tag]);
    setDraft("");
  }

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t} className="flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1 text-sm text-accent-ink">
              {t}
              <input type="hidden" name="activities" value={t} />
              <button
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                aria-label={`Remove ${t}`}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          disabled={full}
          maxLength={LIMITS.activityLength}
          placeholder={full ? `Up to ${LIMITS.activities} activities` : "e.g. Football team"}
          aria-label="Add an activity"
          className={`${input} min-w-0 flex-1`}
        />
        <button type="button" onClick={() => add(draft)} disabled={full || !draft.trim()} className="h-12 rounded-md border border-line-strong bg-white px-4 font-semibold disabled:opacity-50">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Suggestions">
        {ACTIVITY_SUGGESTIONS.filter((s) => !has(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            disabled={full}
            className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft hover:border-accent hover:text-accent-ink disabled:opacity-50"
          >
            + {s}
          </button>
        ))}
      </div>
      <p className={hint}>
        {tags.length}/{LIMITS.activities}
      </p>
    </div>
  );
}

// Up to LIMITS.memories textareas, submitted as repeated "memories" fields.
function MemoriesInput({ initial }: { initial: string[] }) {
  const [items, setItems] = useState(() =>
    (initial.length ? initial : [""]).map((text, i) => ({ id: i, text }))
  );
  const [nextId, setNextId] = useState(initial.length + 1);

  return (
    <div className="space-y-3">
      {items.map((m, i) => (
        <div key={m.id} className="space-y-1">
          <div className="flex items-start gap-2">
            <textarea
              name="memories"
              rows={2}
              maxLength={LIMITS.memoryLength}
              value={m.text}
              onChange={(e) => setItems(items.map((x) => (x.id === m.id ? { ...x, text: e.target.value } : x)))}
              placeholder={i === 0 ? "e.g. Winning the inter-school quiz in 2014" : "Another memory"}
              aria-label={`Memory ${i + 1}`}
              className="min-w-0 flex-1 rounded-md bg-placeholder p-3"
            />
            <button
              type="button"
              onClick={() => setItems(items.length === 1 ? [{ id: nextId, text: "" }] : items.filter((x) => x.id !== m.id))}
              aria-label={`Remove memory ${i + 1}`}
              className="flex h-12 w-12 flex-none items-center justify-center rounded-md border border-line-strong bg-white"
            >
              ×
            </button>
          </div>
          <p className="text-right text-xs text-ink-soft">
            {m.text.length}/{LIMITS.memoryLength}
          </p>
        </div>
      ))}
      {items.length < LIMITS.memories && (
        <button
          type="button"
          onClick={() => {
            setItems([...items, { id: nextId, text: "" }]);
            setNextId(nextId + 1);
          }}
          className="h-12 rounded-md border border-dashed border-line-strong px-4 font-semibold text-ink-soft"
        >
          + Add another memory
        </button>
      )}
    </div>
  );
}
