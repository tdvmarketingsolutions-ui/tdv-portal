import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
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
    <th className={cn("px-5 py-3 font-medium", className)} {...props}>
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
    <td className={cn("px-5 py-3", className)} {...props}>
      {children}
    </td>
  );
}

Table.Head = Head;
Table.HeadCell = HeadCell;
Table.Body = Body;
Table.Row = Row;
Table.Cell = Cell;
