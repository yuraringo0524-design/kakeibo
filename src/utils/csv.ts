/**
 * RFC4180 準拠の最小 CSV パーサ。
 * 以前は `line.split(',')` で読んでいたため、エクスポートした CSV をそのまま
 * 読み戻すだけでデータが壊れていた（メモのカンマで切り詰め、カテゴリ名のカンマで列ずれ、
 * "" のアンエスケープ漏れ、改行入りメモで 1 件が 2 行に分裂）。
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, ''); // Excel が付ける BOM を捨てる
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // "" は " 1 文字
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      endField();
      i += 1;
      continue;
    }
    if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (ch === '\n') {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  // 末尾に改行が無い場合の最終行を取りこぼさない
  if (field !== '' || row.length > 0) endRow();

  // 完全な空行は捨てる
  return rows.filter((r) => r.some((c) => c !== ''));
}

/** 1 セルを CSV 用にエスケープする。 */
export function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
