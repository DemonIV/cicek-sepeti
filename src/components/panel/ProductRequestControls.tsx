"use client";

import { useState, useTransition } from "react";
import { reviewProductRequest } from "@/app/actions/admin";
import { withdrawProductRequest } from "@/app/actions/seller";
import { Icon } from "@/components/ui/Icon";

/* --------------------------- Admin: inceleme ------------------------------ */

/**
 * Operasyon başvuruyu onaylar (ürün oluşur ve yayına çıkar) veya sebep yazarak
 * reddeder. Ret sebebi bayinin panelinde görünür.
 */
export function ProductRequestReview({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ret sebebi (bayi görür)"
          className="field w-auto py-1.5 text-[12.5px] sm:w-56"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reviewProductRequest(requestId, "REDDEDILDI", note);
              setRejecting(false);
            })
          }
          className="btn btn-danger btn-sm"
        >
          Reddet
        </button>
        <button
          type="button"
          onClick={() => setRejecting(false)}
          className="btn btn-ghost btn-sm"
        >
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => reviewProductRequest(requestId, "ONAYLANDI"))
        }
        className="btn btn-primary btn-sm"
      >
        <Icon name="check" size={14} />
        {pending ? "Onaylanıyor…" : "Onayla ve yayına al"}
      </button>
      <button
        type="button"
        onClick={() => setRejecting(true)}
        className="btn btn-ghost btn-sm"
      >
        Reddet
      </button>
    </div>
  );
}

/* --------------------------- Satıcı: geri çekme --------------------------- */

export function ProductRequestWithdraw({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-ghost btn-sm"
      >
        Geri çek
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => withdrawProductRequest(requestId))}
        className="btn btn-danger btn-sm"
      >
        {pending ? "Siliniyor…" : "Evet, geri çek"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="btn btn-ghost btn-sm"
      >
        Vazgeç
      </button>
    </div>
  );
}
