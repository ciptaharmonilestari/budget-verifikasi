"use client";

/** Right-docked slide-over panel — used for the parameter history panel and
 * similar "don't disturb the reading position in a long table" cases. */
export function SlideOver({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="slideOverScrim" onClick={onClose} />
      <div className="slideOver" role="dialog" aria-modal="true" aria-label={title}>
        <div className="slideOverHead">
          <strong style={{ fontSize: 16 }}>{title}</strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="slideOverBody">{children}</div>
      </div>
    </>
  );
}
