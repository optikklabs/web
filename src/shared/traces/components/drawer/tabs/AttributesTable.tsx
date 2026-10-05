import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "@shared/components/ui/data-display/DataTable";

interface Attribute {
  readonly key: string;
  readonly value: string;
}

interface Props {
  readonly attributes: Record<string, string>;
  readonly onAddFilter?: (key: string, value: string) => void;
}

function attributeColumns(onAddFilter: Props["onAddFilter"]): ColumnDef<Attribute>[] {
  return [
    {
      header: "Attribute Key",
      accessorKey: "key",
      cell: ({ row: { original: attr } }) => (
        <span className="break-all font-medium font-mono text-[11.5px] text-foreground-secondary">
          {attr.key}
        </span>
      ),
    },
    {
      header: "Value",
      accessorKey: "value",
      cell: ({ row: { original: attr } }) =>
        onAddFilter ? (
          <button
            type="button"
            onClick={() => onAddFilter(attr.key, attr.value)}
            className="cursor-pointer break-all text-left font-mono text-[11.5px] text-foreground hover:text-primary hover:underline"
            title="Click to filter by attribute"
          >
            {attr.value}
          </button>
        ) : (
          <span className="break-all font-mono text-[11.5px] text-foreground">{attr.value}</span>
        ),
    },
  ];
}

export function AttributesTable({ attributes, onAddFilter }: Props): JSX.Element {
  const rows = Object.keys(attributes)
    .sort()
    .map((key) => ({ key, value: attributes[key] }));

  if (rows.length === 0) {
    return <div className="text-[12px] text-foreground-muted italic">No attributes recorded</div>;
  }

  return (
    <DataTable
      data={{ columns: attributeColumns(onAddFilter), rows }}
      config={{ maxRows: 12, rowHeight: 34 }}
    />
  );
}
