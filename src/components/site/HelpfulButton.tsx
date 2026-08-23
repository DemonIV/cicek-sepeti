"use client";

import { useState, useTransition } from "react";
import { markReviewHelpful } from "@/app/actions/review";
import { Icon } from "@/components/ui/Icon";

/**
 * "Faydalı" oyu. Demo'da kim oy verdiği tutulmuyor; sayaç artar ve düğme
 * kapanır — sunumda tıklanabilir olması yeterli.
 */
export function HelpfulButton({
  reviewId,
  count,
}: {
  reviewId: string;
  count: number;
}) {
  const [voted, setVoted] = useState(false);
  const [total, setTotal] = useState(count);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={voted || pending}
      onClick={() => {
        setVoted(true);
        setTotal((value) => value + 1);
        startTransition(() => markReviewHelpful(reviewId));
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
        voted
          ? "border-fern-300 bg-fern-100 text-fern-700"
          : "border-line text-muted hover:border-plum-300 hover:text-plum-800"
      }`}
    >
      <Icon name="check" size={13} />
      Faydalı ({total})
    </button>
  );
}
