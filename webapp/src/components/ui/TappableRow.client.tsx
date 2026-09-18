"use client";

import { useRouter } from "next/navigation";

export function TappableRow({ href, children }: { href?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr data-tappable={href ? "" : undefined} onClick={href ? () => router.push(href) : undefined}>
      {children}
    </tr>
  );
}
