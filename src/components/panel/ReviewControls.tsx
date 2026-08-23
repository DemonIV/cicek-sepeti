"use client";

import { useState, useTransition } from "react";
import { replyToReview, setReviewHidden } from "@/app/actions/review";
import { Icon } from "@/components/ui/Icon";

/* ------------------------- Satıcı: yoruma cevap --------------------------- */

export function ReviewReply({
  reviewId,
  reply,
}: {
  reviewId: string;
  reply: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply ?? "");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-outline btn-sm"
      >
        {reply ? "Cevabı düzenle" : "Cevap yaz"}
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        maxLength={400}
        placeholder="Müşteriye kısa bir cevap yaz. Vitrinde yorumun altında görünür."
        className="field text-[13px]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await replyToReview(reviewId, text);
              setOpen(false);
            })
          }
          className="btn btn-primary btn-sm"
        >
          {pending ? "Kaydediliyor…" : "Cevabı yayınla"}
        </button>
        <button
          type="button"
          onClick={() => {
            setText(reply ?? "");
            setOpen(false);
          }}
          className="btn btn-ghost btn-sm"
        >
          Vazgeç
        </button>
        {reply && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await replyToReview(reviewId, "");
                setText("");
                setOpen(false);
              })
            }
            className="text-[12px] font-semibold text-[#9c2f2a] hover:underline"
          >
            Cevabı kaldır
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------- Admin: yorumu gizle / göster ---------------------- */

export function ReviewVisibility({
  reviewId,
  hidden,
}: {
  reviewId: string;
  hidden: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setReviewHidden(reviewId, !hidden))}
      className={hidden ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
    >
      <Icon name={hidden ? "check" : "close"} size={14} />
      {pending ? "…" : hidden ? "Yayına al" : "Vitrinden kaldır"}
    </button>
  );
}
