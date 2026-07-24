export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\n\r;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function buildCsv(
  rows: Array<Record<string, unknown>>,
  columns: Array<{
    label: string;
    value: string | ((row: Record<string, unknown>) => unknown);
  }>
): string {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value =
          typeof column.value === "function"
            ? column.value(row)
            : row[column.value];
        return escapeCsvValue(value);
      })
      .join(",")
  );

  return [header, ...body].join("\n");
}
