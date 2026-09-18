"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { ROLE_PANEL, ROLE_FLAGS, type Panel } from "@/lib/reference-data";

const MAX_FAILS = 5;
// FR-001 only specifies the 5-attempt lockout, not an unlock timer, so a
// locked account requires an Owner to clear it from User Management.
const LOCK_DURATION_MS = 100 * 365 * 24 * 3600 * 1000;

export interface LoginResult {
  error?: string;
}

/**
 * Validates credentials + workspace selection with the exact business rules
 * from the prototype (5-fail lockout, cross-workspace rejection), producing
 * specific Indonesian error messages, then hands off to Auth.js to establish
 * the real session. Called from the login form's Server Action.
 */
export async function loginAction(panel: Panel, username: string, password: string): Promise<LoginResult> {
  if (!username.trim() || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (!user || !user.active) {
    return { error: "Username tidak ditemukan." };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { error: "Akun ini terkunci setelah 5 kali percobaan gagal (FR-001). Hubungi Owner untuk membuka kembali." };
  }

  const userPanel = ROLE_PANEL[user.role];
  if (userPanel !== panel) {
    return { error: "Akun ini bukan untuk ruang kerja yang dipilih. Pilih ruang kerja yang sesuai peran akun Anda." };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const failedLoginCount = user.failedLoginCount + 1;
    const locked = failedLoginCount >= MAX_FAILS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: locked ? 0 : failedLoginCount,
        lockedUntil: locked ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });
    if (locked) {
      return { error: "Akun dikunci — 5 kali percobaan gagal (FR-001). Hubungi Owner untuk membuka kembali." };
    }
    return { error: `Password salah. Percobaan tersisa: ${MAX_FAILS - failedLoginCount}.` };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const flags = ROLE_FLAGS[user.role];
  const initialScreen = userPanel === "PENGAJU" ? "berkas" : userPanel === "APPROVER" ? "keputusan" : "antrean";
  void flags;

  try {
    await signIn("credentials", { username, password, redirectTo: `/${initialScreen}` });
  } catch (e) {
    // next-auth's signIn throws a NEXT_REDIRECT "error" on success (Next.js control-flow) — rethrow those.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return { error: "Gagal masuk. Silakan coba lagi." };
  }
  return {};
}

export async function loginFormAction(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const panel = String(formData.get("panel") ?? "PENGAJU") as Panel;
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  return loginAction(panel, username, password);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
