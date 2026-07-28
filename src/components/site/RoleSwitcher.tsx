"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { switchUser } from "@/app/actions/session";
import { ROLES, ROLE_DESCRIPTION, ROLE_LABEL, type Role } from "@/lib/enums";
import { initials } from "@/lib/format";

export type SwitchAccount = {
  id: string;
  name: string;
  role: Role;
  detail: string | null;
};

export function RoleSwitcher({
  current,
  accounts,
}: {
  current: { id: string; name: string; role: Role; detail: string | null };
  accounts: Record<Role, SwitchAccount[]>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selecting, setSelecting] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (id: string) => {
    setSelecting(id);
    startTransition(async () => {
      await switchUser(id);
      setOpen(false);
    });
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-md border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-white/10"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-bloom-600 text-[11px] font-bold text-white">
          {initials(current.name)}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-white/50">
            {ROLE_LABEL[current.role]}
          </span>
          <span className="block text-xs font-semibold text-white">
            {current.name}
          </span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white sm:hidden">
          {ROLE_LABEL[current.role]}
        </span>
        <svg width="10" height="7" viewBox="0 0 12 8" fill="none" aria-hidden>
          <path
            d="M1 1.5 6 6.5 11 1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/60"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_24px_48px_-16px_rgba(11,26,19,0.45)]"
        >
          <div className="border-b border-line bg-plum-50 px-4 py-3">
            <p className="text-xs font-semibold text-plum-900">Rol değiştir</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              Sunum kolaylığı için eklendi. Gerçek sistemde her rol kendi giriş
              ekranından oturum açar.
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto py-1">
            {ROLES.map((role) => {
              const list = accounts[role];
              if (!list?.length) return null;

              return (
                <div key={role} className="px-1.5 py-1">
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                    {ROLE_LABEL[role]} · {ROLE_DESCRIPTION[role]}
                  </p>
                  {list.map((account) => {
                    const active = account.id === current.id;
                    return (
                      <button
                        key={account.id}
                        role="menuitem"
                        type="button"
                        disabled={pending}
                        onClick={() => choose(account.id)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                          active ? "bg-bloom-50" : "hover:bg-plum-50"
                        } ${pending && selecting !== account.id ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`flex h-7 w-7 flex-none items-center justify-center rounded-sm text-[10px] font-bold ${
                            active
                              ? "bg-bloom-600 text-white"
                              : "bg-plum-100 text-plum-700"
                          }`}
                        >
                          {initials(account.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-plum-950">
                            {account.name}
                          </span>
                          {account.detail && (
                            <span className="block truncate text-[11px] text-muted">
                              {account.detail}
                            </span>
                          )}
                        </span>
                        {selecting === account.id && pending ? (
                          <span className="text-[10px] font-semibold text-bloom-600">
                            Geçiliyor…
                          </span>
                        ) : active ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-bloom-600">
                            Aktif
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
