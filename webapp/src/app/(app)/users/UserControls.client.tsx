"use client";

import { useState } from "react";
import type { Role } from "@/generated/prisma/client";
import { ROLE_LABEL } from "@/lib/reference-data";
import { changeUserRoleAction, toggleUserActiveAction, unlockUserAction } from "./actions";

const ROLE_OPTIONS = Object.keys(ROLE_LABEL) as Role[];

export function RoleSelect({ userId, role, isOwner }: { userId: string; role: Role; isOwner: boolean }) {
  const [value, setValue] = useState<Role>(role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        className="select"
        value={value}
        disabled={!isOwner || pending}
        onChange={async (e) => {
          const next = e.target.value as Role;
          const previous = value;
          setValue(next);
          setPending(true);
          setError(null);
          const res = await changeUserRoleAction(userId, next);
          if (res.error) {
            setError(res.error);
            setValue(previous);
          }
          setPending(false);
        }}
        style={{ minWidth: 170 }}
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {!isOwner && (
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, maxWidth: 170 }}>Hanya Owner yang dapat mengubah peran.</div>
      )}
      {error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function ActiveToggle({ userId, active, isOwner }: { userId: string; active: boolean; isOwner: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) return null;

  return (
    <div>
      <button
        type="button"
        className={`btn btn-sm${active ? " btn-danger" : " btn-primary"}`}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const res = await toggleUserActiveAction(userId);
          if (res.error) setError(res.error);
          setPending(false);
        }}
      >
        {active ? "Nonaktifkan" : "Aktifkan"}
      </button>
      {error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function UnlockButton({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) return null;

  return (
    <div>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const res = await unlockUserAction(userId);
          if (res.error) setError(res.error);
          setPending(false);
        }}
      >
        Buka kunci
      </button>
      {error && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}
