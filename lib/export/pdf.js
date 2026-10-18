import PDFDocument from "pdfkit";
import { INK, ORDINAL, SEQUENTIAL, SERIES, DIVERGING } from "@/lib/chartTheme";
import { compact } from "@/lib/charts";

const MARGIN = 40;
const PAGE = { width: 595.28, height: 841.89 };
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const BOTTOM = PAGE.height - MARGIN - 24;

/** Renders a report into a PDF buffer, charts included. */
export function buildPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawCover(doc, report);
    drawKpis(doc, report);

    for (const sheet of report.sheets) {
      drawSection(doc, sheet, report);
    }

    paginate(doc, report);
    doc.end();
  });
}

function drawCover(doc, report) {
  doc.save();
  doc.rect(0, 0, PAGE.width, 96).fill(SERIES[0]);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text(report.title, MARGIN, 30, {
    width: CONTENT_WIDTH,
  });
  doc.font("Helvetica").fontSize(10).fillColor("#fbe2d6");
  doc.text(report.subtitle, MARGIN, 58, { width: CONTENT_WIDTH });
  doc.restore();

  doc.y = 118;
  doc.font("Helvetica").fontSize(9).fillColor(INK.muted);
  const window = report.window.from
    ? `${report.window.label} · ${report.window.from} to ${report.window.to}`
    : `${report.window.label} · up to ${report.window.to}`;
  doc.text(`${window}    ·    Generated ${report.generatedAt}`, MARGIN, doc.y);
  if (report.filterSummary.length) {
    doc.text(report.filterSummary.map(([k, v]) => `${k}: ${v}`).join("    ·    "), MARGIN, doc.y + 2);
  }
  doc.moveDown(1);
}

function drawKpis(doc, report) {
  const tiles = report.kpis;
  const perRow = 3;
  const gap = 12;
  const w = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
  const h = 54;
  let y = doc.y + 6;

  tiles.forEach((tile, i) => {
    const col = i % perRow;
    if (col === 0 && i > 0) y += h + gap;
    const x = MARGIN + col * (w + gap);
    doc.save();
    doc.roundedRect(x, y, w, h, 8).lineWidth(0.8).fillAndStroke("#fffdfa", "#fbe4c4");
    doc.fillColor(INK.muted).font("Helvetica").fontSize(7.5).text(tile.label.toUpperCase(), x + 10, y + 10, {
      width: w - 20,
      lineBreak: false,
      ellipsis: true,
    });
    doc.fillColor(INK.primary).font("Helvetica-Bold").fontSize(15).text(String(tile.value), x + 10, y + 24, {
      width: w - 20,
      lineBreak: false,
      ellipsis: true,
    });
    doc.restore();
  });

  doc.y = y + h + 20;
}

function drawSection(doc, sheet, report) {
  const chartHeight = sheet.chart ? chartHeightFor(sheet.chart) : 0;
  ensureSpace(doc, 34 + chartHeight + 60);

  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK.primary).text(sheet.name, MARGIN, doc.y);
  doc.moveDown(0.35);

  if (!sheet.rows.length) {
    doc.font("Helvetica-Oblique").fontSize(9).fillColor(INK.muted).text("No data in this period.", MARGIN, doc.y);
    doc.moveDown(1);
    return;
  }

  if (sheet.chart) {
    drawChart(doc, sheet.chart);
    doc.moveDown(0.6);
  }

  drawTable(doc, sheet, report);
  doc.moveDown(1);
}

function chartHeightFor(chart) {
  if (chart.type === "line") return 150;
  return Math.min(220, 24 + chart.points.length * 18);
}

function drawChart(doc, chart) {
  const height = chartHeightFor(chart);
  ensureSpace(doc, height + 20);
  const top = doc.y;

  doc.font("Helvetica").fontSize(8).fillColor(INK.muted).text(chart.title, MARGIN, top);
  const plotTop = top + 14;

  if (chart.type === "line") drawLineChart(doc, MARGIN, plotTop, CONTENT_WIDTH, height - 20, chart);
  else if (chart.type === "diverging") drawDivergingChart(doc, MARGIN, plotTop, CONTENT_WIDTH, chart);
  else drawBarChart(doc, MARGIN, plotTop, CONTENT_WIDTH, chart);

  doc.y = plotTop + (height - 14);
}

function drawLineChart(doc, x, y, w, h, chart) {
  const points = chart.points;
  const max = Math.max(...points.map((p) => Math.max(p.value, p.secondary ?? 0)), 1);
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const at = (v) => y + h - (v / max) * h;

  doc.save();
  doc.lineWidth(0.5).strokeColor("#f4e8db");
  for (let i = 0; i <= 4; i++) {
    const gy = y + (h / 4) * i;
    doc.moveTo(x, gy).lineTo(x + w, gy).stroke();
  }

  if (points.length > 1) {
    doc.moveTo(x, at(points[0].value));
    points.forEach((p, i) => doc.lineTo(x + i * stepX, at(p.value)));
    doc.lineTo(x + (points.length - 1) * stepX, y + h).lineTo(x, y + h).closePath();
    doc.fillOpacity(0.12).fill(SERIES[0]).fillOpacity(1);

    doc.moveTo(x, at(points[0].value));
    points.forEach((p, i) => doc.lineTo(x + i * stepX, at(p.value)));
    doc.lineWidth(1.4).strokeColor(SERIES[0]).stroke();

    if (points.some((p) => p.secondary != null)) {
      doc.moveTo(x, at(points[0].secondary ?? 0));
      points.forEach((p, i) => doc.lineTo(x + i * stepX, at(p.secondary ?? 0)));
      doc.lineWidth(1.2).strokeColor(SERIES[1]).stroke();
    }
  }

  doc.font("Helvetica").fontSize(6.5).fillColor(INK.muted);
  const every = Math.max(1, Math.ceil(points.length / 8));
  points.forEach((p, i) => {
    if (i % every && i !== points.length - 1) return;
    doc.text(p.label, x + i * stepX - 16, y + h + 4, { width: 32, align: "center", lineBreak: false });
  });
  doc.text(compact(max), x, y - 8, { width: 60, lineBreak: false });
  doc.restore();
}

function drawBarChart(doc, x, y, w, chart) {
  const labelW = 110;
  const valueW = 68;
  const trackW = w - labelW - valueW - 12;
  const max = Math.max(...chart.points.map((p) => p.value), 1);
  const format = chart.format ?? ((v) => compact(v));

  doc.save();
  chart.points.forEach((point, i) => {
    const rowY = y + i * 18;
    doc.font("Helvetica").fontSize(7.5).fillColor(INK.secondary);
    doc.text(point.label, x, rowY + 2, { width: labelW, lineBreak: false, ellipsis: true });

    const barW = Math.max((point.value / max) * trackW, point.value > 0 ? 1.5 : 0);
    doc.roundedRect(x + labelW + 6, rowY, trackW, 9, 2).fill("#fdf0dd");
    if (barW > 0) {
      doc.roundedRect(x + labelW + 6, rowY, barW, 9, 2).fill(SERIES[0]);
    }

    doc.fillColor(INK.primary).font("Helvetica-Bold").fontSize(7.5);
    doc.text(format(point.value), x + labelW + trackW + 12, rowY + 1, {
      width: valueW,
      align: "right",
      lineBreak: false,
    });
  });
  doc.restore();
}

function drawDivergingChart(doc, x, y, w, chart) {
  const labelW = 110;
  const valueW = 58;
  const trackW = w - labelW - valueW - 12;
  const centre = x + labelW + 6 + trackW / 2;
  const max = Math.max(...chart.points.map((p) => Math.abs(p.value)), 1);
  const format = chart.format ?? ((v) => `${v}`);

  doc.save();
  chart.points.forEach((point, i) => {
    const rowY = y + i * 18;
    doc.font("Helvetica").fontSize(7.5).fillColor(INK.secondary);
    doc.text(point.label, x, rowY + 2, { width: labelW, lineBreak: false, ellipsis: true });

    const width = (Math.abs(point.value) / max) * (trackW / 2);
    const positive = point.value >= 0;
    if (width > 0) {
      doc
        .rect(positive ? centre : centre - width, rowY, width, 9)
        .fill(positive ? DIVERGING.positive : DIVERGING.negative);
    }

    doc.fillColor(INK.primary).font("Helvetica-Bold").fontSize(7.5);
    doc.text(format(point.value), x + labelW + trackW + 12, rowY + 1, {
      width: valueW,
      align: "right",
      lineBreak: false,
    });
  });

  doc.lineWidth(0.6).strokeColor(INK.axis);
  doc.moveTo(centre, y - 2).lineTo(centre, y + chart.points.length * 18).stroke();
  doc.restore();
}

function drawTable(doc, sheet, report) {
  const cols = sheet.columns.length;
  const firstW = Math.min(190, CONTENT_WIDTH * 0.4);
  const restW = (CONTENT_WIDTH - firstW) / Math.max(cols - 1, 1);
  const widths = sheet.columns.map((_, i) => (i === 0 ? firstW : restW));
  const rowHeight = 15;

  const header = () => {
    doc.save();
    doc.rect(MARGIN, doc.y, CONTENT_WIDTH, rowHeight).fill("#fdf0dd");
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(INK.secondary);
    let x = MARGIN;
    sheet.columns.forEach((col, i) => {
      doc.text(col, x + 5, doc.y + 4.5, {
        width: widths[i] - 10,
        align: i ? "right" : "left",
        lineBreak: false,
        ellipsis: true,
      });
      x += widths[i];
    });
    doc.restore();
    doc.y += rowHeight;
  };

  ensureSpace(doc, rowHeight * 3);
  header();

  const rows = sheet.rows.slice(0, report.maxTableRows);
  rows.forEach((row, index) => {
    if (doc.y + rowHeight > BOTTOM) {
      doc.addPage();
      header();
    }
    if (index % 2 === 1) {
      doc.rect(MARGIN, doc.y, CONTENT_WIDTH, rowHeight).fill("#fffdfa");
    }
    doc.font("Helvetica").fontSize(7.5).fillColor(INK.primary);
    let x = MARGIN;
    row.forEach((cell, i) => {
      const text = sheet.money?.includes(i) ? report.money(cell) : String(cell ?? "");
      doc.text(text, x + 5, doc.y + 4.5, {
        width: widths[i] - 10,
        align: i ? "right" : "left",
        lineBreak: false,
        ellipsis: true,
      });
      x += widths[i];
    });
    doc.y += rowHeight;
  });

  if (sheet.rows.length > rows.length) {
    doc.font("Helvetica-Oblique").fontSize(7).fillColor(INK.muted);
    doc.text(
      `${sheet.rows.length - rows.length} more rows — the Excel export carries the full table.`,
      MARGIN,
      doc.y + 3
    );
    doc.y += 12;
  }
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > BOTTOM) doc.addPage();
}

function paginate(doc, report) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.font("Helvetica").fontSize(7.5).fillColor(INK.muted);
    doc.text(
      `${report.title} · ${report.window.label}`,
      MARGIN,
      PAGE.height - MARGIN - 6,
      { width: CONTENT_WIDTH - 60, lineBreak: false }
    );
    doc.text(`${i + 1} / ${range.count}`, PAGE.width - MARGIN - 60, PAGE.height - MARGIN - 6, {
      width: 60,
      align: "right",
      lineBreak: false,
    });
  }
}

export const PDF_PALETTE = { SERIES, ORDINAL, SEQUENTIAL };
