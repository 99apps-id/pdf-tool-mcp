import ExcelJS from "exceljs";
import { checkToolQuota } from "../auth.js";
import type { BankTransaction } from "../lib/types.js";

export async function exportToExcel(
  transactions: BankTransaction[],
  outputPath: string,
  accountInfo?: { bank?: string; accountNumber?: string; accountName?: string; period?: string },
) {
  await checkToolQuota(false); // Free & unlimited

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kliimora PDF MCP Server";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Mutasi Rekening");

  // Metadata headers if available
  let currentRow = 1;
  if (accountInfo) {
    if (accountInfo.bank) {
      worksheet.getCell(`A${currentRow}`).value = `Bank: ${accountInfo.bank}`;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
    }
    if (accountInfo.accountNumber) {
      worksheet.getCell(`A${currentRow}`).value = `No. Rekening: ${accountInfo.accountNumber}`;
      currentRow++;
    }
    if (accountInfo.accountName) {
      worksheet.getCell(`A${currentRow}`).value = `Nama: ${accountInfo.accountName}`;
      currentRow++;
    }
    if (accountInfo.period) {
      worksheet.getCell(`A${currentRow}`).value = `Periode: ${accountInfo.period}`;
      currentRow++;
    }
    currentRow++; // Blank row
  }

  // Table Columns Header
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = ["No", "Tanggal", "Keterangan", "Tipe (DB/CR)", "Nominal (IDR)", "Saldo"];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate-800
  };
  currentRow++;

  let idx = 1;
  for (const t of transactions) {
    const row = worksheet.getRow(currentRow);
    row.values = [
      idx++,
      t.date,
      t.description,
      t.type,
      t.amount,
      t.balance ?? "-",
    ];

    // Alignments & formats
    row.getCell(5).numFmt = "#,##0.00";
    if (typeof t.balance === "number") {
      row.getCell(6).numFmt = "#,##0.00";
    }

    // Color code DB (Red) vs CR (Green)
    if (t.type === "DB") {
      row.getCell(4).font = { color: { argb: "FFDC2626" }, bold: true };
    } else {
      row.getCell(4).font = { color: { argb: "FF16A34A" }, bold: true };
    }

    currentRow++;
  }

  // Auto-fit column widths
  worksheet.columns = [
    { width: 6 },
    { width: 14 },
    { width: 45 },
    { width: 14 },
    { width: 20 },
    { width: 20 },
  ];

  await workbook.xlsx.writeFile(outputPath);

  return {
    success: true,
    rowCount: transactions.length,
    outputPath,
    message: `Successfully exported ${transactions.length} transactions to Excel file.`,
  };
}
