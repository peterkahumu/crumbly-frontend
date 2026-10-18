import ExcelJS from "exceljs";
import { CURRENCY } from "@/lib/currency";

const MONEY_FORMAT = `"${CURRENCY === "KES" ? "KSh" : CURRENCY}" #,##0`;
const BRAND = "FFC1502E";
const HEADER_TEXT = "FFFFFFFF";

/** Renders a report into an .xlsx buffer, one sheet per section. */
export async function buildWorkbook(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Crumbly";
  wb.created = new Date();

  for (const sheet of report.sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31), {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    ws.mergeCells(1, 1, 1, Math.max(sheet.columns.length, 2));
    const title = ws.getCell(1, 1);
    title.value = `${report.title} — ${sheet.name}`;
    title.font = { bold: true, size: 13, color: { argb: "FF2E1B19" } };

    ws.mergeCells(2, 1, 2, Math.max(sheet.columns.length, 2));
    const subtitle = ws.getCell(2, 1);
    subtitle.value = `${report.window.label}${report.window.from ? ` (${report.window.from} to ${report.window.to})` : ""} · generated ${report.generatedAt}`;
    subtitle.font = { size: 9, color: { argb: "FF6B4038" } };

    const headerRow = ws.getRow(3);
    headerRow.values = sheet.columns;
    headerRow.font = { bold: true, color: { argb: HEADER_TEXT } };
    headerRow.alignment = { vertical: "middle" };
    headerRow.eachCell((cell, col) => {
      if (col > sheet.columns.length) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
      cell.border = { bottom: { style: "thin", color: { argb: "FFFBE4C4" } } };
    });
    headerRow.height = 20;

    for (const row of sheet.rows) {
      ws.addRow(row);
    }

    sheet.columns.forEach((name, i) => {
      const column = ws.getColumn(i + 1);
      const longest = sheet.rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), name.length);
      column.width = Math.min(46, Math.max(12, longest + 3));
      if (sheet.money?.includes(i)) column.numFmt = MONEY_FORMAT;
      if (i > 0) column.alignment = { horizontal: "right" };
    });

    ws.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: sheet.columns.length },
    };

    // In-cell data bars stand in for the dashboard's chart on numeric columns.
    if (sheet.bars != null && sheet.rows.length) {
      const letter = ws.getColumn(sheet.bars + 1).letter;
      ws.addConditionalFormatting({
        ref: `${letter}4:${letter}${3 + sheet.rows.length}`,
        rules: [
          {
            type: "dataBar",
            cfvo: [{ type: "min" }, { type: "max" }],
            color: { argb: BRAND },
            minLength: 0,
            maxLength: 100,
            gradient: false,
            showValue: true,
          },
        ],
      });
    }

    if (!sheet.rows.length) {
      const empty = ws.addRow(["No data in this period"]);
      empty.font = { italic: true, color: { argb: "FF8A6A60" } };
    }
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
