export function createSimplePdf(
  title: string,
  subtitle: string | undefined,
  lines: string[]
): Buffer {
  const pageWidth = 842;
  const pageHeight = 595;
  const marginX = 40;
  const marginTop = 48;
  const marginBottom = 40;
  const titleSize = 18;
  const subtitleSize = 11;
  const bodySize = 9;
  const bodyLeading = 12;
  const maxBodyLines = Math.max(
    1,
    Math.floor((pageHeight - marginTop - marginBottom - 80) / bodyLeading)
  );

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += maxBodyLines) {
    pages.push(lines.slice(i, i + maxBodyLines));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const sanitize = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');

  const pageCount = pages.length;
  const objects: string[] = new Array(3 + pageCount * 2);

  const buildContent = (pageLines: string[], pageNumber: number) => {
    const ops: string[] = [];
    const titleY = pageHeight - marginTop;
    const subtitleY = titleY - 22;
    let bodyY = subtitle ? subtitleY - 24 : titleY - 24;

    ops.push('BT');
    ops.push(`/F1 ${titleSize} Tf`);
    ops.push(`${marginX} ${titleY} Td`);
    ops.push(`(${sanitize(title)}) Tj`);

    if (subtitle) {
      ops.push(`/F1 ${subtitleSize} Tf`);
      ops.push(`${marginX} ${subtitleY} Td`);
      ops.push(`(${sanitize(subtitle)}) Tj`);
    }

    ops.push(`/F1 ${bodySize} Tf`);

    for (const line of pageLines) {
      ops.push(`${marginX} ${bodyY} Td`);
      ops.push(`(${sanitize(line)}) Tj`);
      bodyY -= bodyLeading;
    }

    ops.push(`/F1 8 Tf`);
    ops.push(`${marginX} ${marginBottom - 2} Td`);
    ops.push(`(Page ${pageNumber} of ${pageCount}) Tj`);
    ops.push('ET');

    return ops.join('\n');
  };

  for (let i = 0; i < pageCount; i += 1) {
    const contentObjectNumber = 4 + i * 2;
    const pageObjectNumber = contentObjectNumber + 1;
    const content = buildContent(pages[i], i + 1);

    objects[contentObjectNumber - 1] = [
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>`,
      'stream',
      content,
      'endstream',
    ].join('\n');

    objects[pageObjectNumber - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
  }

  objects[1] = `<< /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pageCount} >>`;
  objects[2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const parts: string[] = [header];
  const offsets: number[] = [];
  let currentOffset = Buffer.byteLength(header, 'utf8');

  for (let i = 0; i < objects.length; i += 1) {
    const serialized = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    offsets.push(currentOffset);
    parts.push(serialized);
    currentOffset += Buffer.byteLength(serialized, 'utf8');
  }

  const xrefOffset = currentOffset;
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ].join('\n');

  return Buffer.from(`${parts.join('')}${xref}`, 'utf8');
}
