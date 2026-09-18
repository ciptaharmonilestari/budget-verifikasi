"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export type DocStamp = "DRAF" | "FINAL" | "LUNAS" | "VOID";

const STAMP_COLOR: Record<DocStamp, string> = {
  DRAF: "#1b1b1b", FINAL: "#1b1b1b", LUNAS: "#3f6b45", VOID: "#b42318",
};

function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}

const PAGE_CONTENT_LIMIT_PX = mmToPx(258);

/** Splits each non-wide `.om-sheet`'s direct children into `.om-page` groups
 * sized to fit an A4 page (measured, since CSS alone can't compute "how many
 * children fit before hal. x dari y needs to roll over"), each with its own
 * footer. Wide (landscape BAPP) sheets are left as one continuous flow and
 * rely on the browser's native page breaks + `break-inside:avoid` instead —
 * matching the prototype's own approach. Reversible via `unpaginate`. */
function paginate(footText: string) {
  const sheets = document.querySelectorAll<HTMLElement>(".om-sheet:not(.om-wide)");
  sheets.forEach((sheet) => {
    const originalChildren = Array.from(sheet.children) as HTMLElement[];
    const stampEl = originalChildren.find((el) => el.classList.contains("om-stamp"));
    const contentChildren = originalChildren.filter((el) => !el.classList.contains("om-stamp"));

    sheet.dataset.omOriginalHtml = sheet.innerHTML;

    const pages: HTMLElement[][] = [[]];
    let currentHeight = 0;
    for (const child of contentChildren) {
      const h = child.getBoundingClientRect().height;
      if (currentHeight + h > PAGE_CONTENT_LIMIT_PX && pages[pages.length - 1].length > 0) {
        pages.push([]);
        currentHeight = 0;
      }
      pages[pages.length - 1].push(child);
      currentHeight += h;
    }

    sheet.innerHTML = "";
    pages.forEach((group, i) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "om-page";
      const body = document.createElement("div");
      body.className = "om-page-body";
      group.forEach((el) => body.appendChild(el));
      const foot = document.createElement("div");
      foot.className = "om-foot om-page-foot";
      foot.textContent = `${footText} · hal. ${i + 1} dari ${pages.length}`;
      pageDiv.appendChild(body);
      pageDiv.appendChild(foot);
      if (stampEl) pageDiv.appendChild(stampEl.cloneNode(true) as HTMLElement);
      sheet.appendChild(pageDiv);
    });
  });
}

function unpaginate() {
  const sheets = document.querySelectorAll<HTMLElement>(".om-sheet:not(.om-wide)");
  sheets.forEach((sheet) => {
    if (sheet.dataset.omOriginalHtml !== undefined) {
      sheet.innerHTML = sheet.dataset.omOriginalHtml;
      delete sheet.dataset.omOriginalHtml;
    }
  });
}

export function PrintToolbar({ footText, defaultStamp }: { footText: string; defaultStamp: DocStamp }) {
  const router = useRouter();
  const [stamp, setStamp] = useState<DocStamp>(defaultStamp);

  const applyStamp = useCallback((s: DocStamp) => {
    document.querySelectorAll<HTMLElement>(".om-stamp").forEach((el) => {
      el.textContent = s === "FINAL" ? "" : s;
      el.style.color = STAMP_COLOR[s];
      el.style.display = s === "FINAL" ? "none" : "flex";
    });
  }, []);

  useEffect(() => {
    applyStamp(stamp);
  }, [stamp, applyStamp]);

  function doPrint() {
    applyStamp(stamp);
    document.body.classList.add("om-printing");
    setTimeout(() => {
      paginate(footText);
      setTimeout(() => {
        window.print();
      }, 60);
    }, 120);
  }

  return (
    <div className="om-toolbar">
      <span>Cap status:</span>
      {(["DRAF", "FINAL", "LUNAS", "VOID"] as DocStamp[]).map((s) => (
        <button
          key={s}
          type="button"
          className="btn btn-sm"
          style={stamp === s ? { background: "#fff", color: "#111" } : { background: "transparent", color: "#ccc", borderColor: "#555" }}
          onClick={() => setStamp(s)}
        >
          {s}
        </button>
      ))}
      <button type="button" className="btn btn-sm btn-primary" onClick={doPrint}>Cetak / simpan PDF</button>
      <button type="button" className="btn btn-sm" style={{ background: "transparent", color: "#ccc", borderColor: "#555" }} onClick={() => router.back()}>
        Tutup
      </button>
    </div>
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("om-printing");
    unpaginate();
  });
}
