import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      {/* min-w-max + nowrap cells (below) keep every column at its natural
          width instead of the browser shrinking/wrapping everything to fit
          a narrow viewport — that's what made mobile tables unreadable
          (multi-line titles, tiny squeezed columns). Now a narrow screen
          scrolls the table horizontally instead, same as any data table. */}
      <table className="w-full min-w-max text-left text-sm">{children}</table>
    </div>
  );
}

function Head({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border text-xs text-ink-muted dark:border-border-dark dark:text-ink-dark-muted">
      <tr>{children}</tr>
    </thead>
  );
}

function HeadCell({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("whitespace-nowrap px-5 py-3 font-medium", className)} {...props}>
      {children}
    </th>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border dark:divide-border-dark">{children}</tbody>;
}

function Row({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("transition-colors hover:bg-canvas dark:hover:bg-canvas-dark", className)} {...props}>
      {children}
    </tr>
  );
}

function Cell({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("whitespace-nowrap px-5 py-3", className)} {...props}>
      {children}
    </td>
  );
}

Table.Head = Head;
Table.HeadCell = HeadCell;
Table.Body = Body;
Table.Row = Row;
Table.Cell = Cell;
