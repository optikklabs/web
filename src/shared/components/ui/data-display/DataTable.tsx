import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/primitives/ui/table";
import EmptyState from "@shared/components/ui/feedback/EmptyState";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useMemo, useRef, useState } from "react";

import { ExplorerTableFooter } from "@shared/search/components/chrome/ExplorerTableFooter";

import { useColumnSizing } from "./useColumnSizing";

interface DataTablePagination {
  /** Rows per page. Providing this (with showPagination !== false) enables client-side paging. */
  pageSize?: number;
  /** Notified when the user changes page. Page state is owned by the table. */
  onPageChange?: (page: number, pageSize?: number) => void;
  showPagination?: boolean;
}

const DEFAULT_PAGE_SIZE = 25;

interface DataTableConfig<TData> {
  emptyText?: string;
  /**
   * Rows visible before the body scrolls. Required for tables embedded in a
   * fixed-height surface (a chart card, a panel) so the table scrolls inside
   * itself instead of growing the surface. Omit for full-page tables, which
   * fall back to DEFAULT_MAX_HEIGHT.
   */
  maxRows?: number;
  /** Row height in px, used for both the maxRows viewport and virtualization. */
  rowHeight?: number;
  onRow?: (record: TData, index?: number) => React.HTMLAttributes<HTMLTableRowElement>;
}

interface DataTableResize {
  storageKey?: string;
}

interface DataTableProps<TData, TValue> {
  data: {
    columns: ColumnDef<TData, TValue>[];
    rows: TData[];
    loading?: boolean;
  };
  pagination?: DataTablePagination;
  config?: DataTableConfig<TData>;

  resize?: DataTableResize;
}

const DEFAULT_COLUMN_SIZE = 150;
const DEFAULT_ROW_HEIGHT = 48;
/** Height of the sticky header row (`h-9` on TableHead). */
const HEADER_HEIGHT = 36;
const DEFAULT_MAX_HEIGHT = 600;

/**
 * DataTable is the default table for all list/tabular UI in this codebase.
 * New tables should use it instead of hand-rolled <table> markup: it provides
 * virtualized rendering, loading/empty states, column alignment via meta,
 * per-row props (click navigation, hover styling) via config.onRow, optional
 * column resizing, a bounded scroll viewport via config.maxRows, and optional
 * client-side pagination via the pagination prop. Extend this component rather
 * than forking table markup in a feature.
 */
function DataTableInner<TData, TValue>({
  data,
  pagination,
  config = {},
  resize,
}: DataTableProps<TData, TValue>): JSX.Element {
  const { columns, rows, loading = false } = data;
  const { emptyText = "No data found", maxRows, rowHeight = DEFAULT_ROW_HEIGHT, onRow } = config;
  const maxHeight =
    maxRows === undefined ? DEFAULT_MAX_HEIGHT : HEADER_HEIGHT + maxRows * rowHeight;
  const resizable = resize !== undefined;
  const { columnSizing, onColumnSizingChange } = useColumnSizing(resize?.storageKey);

  const paginated = pagination !== undefined && pagination.showPagination !== false;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = useMemo(
    () => (paginated ? rows.slice(safePage * pageSize, (safePage + 1) * pageSize) : rows),
    [paginated, rows, safePage, pageSize]
  );

  const goToPage = (next: number): void => {
    setPage(next);
    pagination?.onPageChange?.(next, pageSize);
  };

  const table = useReactTable({
    data: visibleRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: resizable,
    columnResizeMode: "onChange",
    state: resizable ? { columnSizing } : {},
    onColumnSizingChange,
  });

  const { rows: tableRows } = table.getRowModel();
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-md border border-border bg-surface/50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-foreground-muted text-sm">Loading data...</span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="No Data" description={emptyText} />;
  }

  return (
    <>
      <div
        ref={scrollRef}
        style={{ maxHeight }}
        className={`relative w-full overflow-auto border border-border bg-surface ${
          paginated ? "rounded-t-md" : "rounded-md"
        }`}
      >
        <Table className="relative w-full border-collapse text-left text-sm">
          <TableHeader className="sticky top-0 z-15 bg-surface-elevated shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border border-b hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const align =
                    (header.column.columnDef.meta as { align?: string } | undefined)?.align ??
                    "left";
                  const isCustomWidth =
                    resizable &&
                    header.column.columnDef.size !== undefined &&
                    header.column.columnDef.size !== DEFAULT_COLUMN_SIZE;
                  const widthStyle = resizable
                    ? isCustomWidth
                      ? { width: `${header.getSize()}px` }
                      : { width: `${header.getSize()}px`, flex: "1 1 0%" }
                    : undefined;
                  return (
                    <TableHead
                      key={header.id}
                      style={{ textAlign: align as "left" | "center" | "right", ...widthStyle }}
                      className={
                        resizable ? "group/col relative select-none overflow-hidden" : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {resizable && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border-light opacity-0 transition-opacity group-hover/col:opacity-100 ${
                            header.column.getIsResizing() ? "bg-primary opacity-100" : ""
                          }`}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              const rowProps = onRow ? onRow(row.original, virtualRow.index) : {};
              return (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} {...rowProps}>
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (cell.column.columnDef.meta as { align?: string } | undefined)?.align ??
                      "left";
                    return (
                      <TableCell
                        key={cell.id}
                        style={{ textAlign: align as "left" | "center" | "right" }}
                        className={resizable ? "overflow-hidden" : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
      {paginated && (
        <div className="rounded-b-md border border-border border-t-0 bg-card">
          <ExplorerTableFooter
            summary={`${safePage * pageSize + 1}–${Math.min(
              (safePage + 1) * pageSize,
              rows.length
            )} of ${rows.length}`}
            onPrevPage={() => goToPage(safePage - 1)}
            onNextPage={() => goToPage(safePage + 1)}
            hasPrevPage={safePage > 0}
            hasNextPage={(safePage + 1) * pageSize < rows.length}
          />
        </div>
      )}
    </>
  );
}

export default memo(DataTableInner) as typeof DataTableInner;
