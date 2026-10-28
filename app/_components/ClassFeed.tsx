"use client";

import Link from "next/link";
import { useActionState, useOptimistic } from "react";
import type { ActionState } from "@/lib/alumni/actions";
import { Avatar } from "./alumni";

export type FeedPost = {
  id: string;
  content: string;
  authorName: string;
  authorProfileId: string | null;
  authorPhoto?: string | null;
  timeLabel: string;
  pending?: boolean;
};

type Props = {
  posts: FeedPost[];
  canPost: boolean;
  viewerName: string;
  viewerPhoto?: string | null;
  maxLength: number;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

// Screen 1e feed. New posts appear immediately (optimistically) and are
// replaced by the server's copy once the page refreshes.
export default function ClassFeed({ posts, canPost, viewerName, viewerPhoto, maxLength, action }: Props) {
  const [shown, addPending] = useOptimistic(posts, (state, post: FeedPost) => [post, ...state]);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const content = String(formData.get("content") ?? "").trim();
      if (content) {
        addPending({
          id: `pending-${Date.now()}`,
          content,
          authorName: viewerName,
          authorProfileId: null,
          authorPhoto: viewerPhoto,
          timeLabel: "posting…",
          pending: true,
        });
      }
      return action(prev, formData);
    },
    {}
  );

  return (
    <div className="space-y-4">
      {canPost && (
        <form action={formAction} className="space-y-2 rounded-xl border border-line bg-white p-4">
          <label htmlFor="content" className="sr-only">
            Write a post
          </label>
          <textarea
            // Remount after an error so the draft comes back
            key={state.error ? `retry-${state.content}` : "new"}
            id="content"
            name="content"
            required
            maxLength={maxLength}
            rows={3}
            defaultValue={state.content}
            placeholder="Write a post…"
            className="w-full rounded-md bg-placeholder p-3"
          />
          <div className="flex items-center justify-between gap-3">
            <p role="status" className="text-sm text-amber">
              {state.error}
            </p>
            <button
              disabled={pending}
              className="h-12 rounded-md bg-ink px-5 font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      )}

      {shown.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-6 text-center text-ink-soft">
          No posts yet.{canPost && " Be the first to say hello!"}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((post) => (
            <li
              key={post.id}
              className={`rounded-xl border border-line bg-white p-4 ${post.pending ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={post.authorName} size="sm" photo={post.authorPhoto} />
                <p className="text-sm">
                  {post.authorProfileId ? (
                    <Link href={`/alumni/profile/${post.authorProfileId}`} className="font-semibold hover:underline">
                      {post.authorName}
                    </Link>
                  ) : (
                    <span className="font-semibold">{post.authorName}</span>
                  )}
                  <span className="text-ink-soft"> · {post.timeLabel}</span>
                </p>
              </div>
              <p className="mt-2 whitespace-pre-line break-words">{post.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
