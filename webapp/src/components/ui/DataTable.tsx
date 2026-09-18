import { TappableRow } from "./TappableRow.client";

export interface DataColumn<T> {
  key: string;
  header: string;
  /** Core columns stay visible on mobile (≤900px); non-core columns hide via [data-extra]. */
  core?: boolean;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

/**
 * Table with the prototype's mobile pattern: on narrow screens, non-core
 * columns hide (see .tbl [data-extra] in globals.css) and tapping a row
 * navigates to a full detail page instead of trying to show every column.
 *
 * This is a Server Component on purpose — `columns[].render` is a plain
 * function called here at render time (server-side), never passed across
 * the client boundary (functions aren't serializable as props to a Client
 * Component). Only the already-rendered cells (React elements, which *are*
 * serializable as `children`) are handed to the small client-side
 * `TappableRow` that adds the tap-to-navigate behavior.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  getRowHref,
  emptyLabel = "Tidak ada data.",
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  getRowHref?: (row: T) => string;
  emptyLabel?: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} data-extra={c.core ? undefined : ""} style={{ textAlign: c.align ?? "left" }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const href = getRowHref?.(row);
            return (
              <TappableRow key={rowKey(row)} href={href}>
                {columns.map((c) => (
                  <td key={c.key} data-extra={c.core ? undefined : ""} style={{ textAlign: c.align ?? "left" }}>
                    {c.render(row)}
                  </td>
                ))}
              </TappableRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
