import * as fs from "node:fs/promises";
import { PDFDocument } from "@cantoo/pdf-lib";
import { checkToolQuota } from "../auth.js";

export async function unlockPdf(inputPath: string, password: string, outputPath: string) {
  await checkToolQuota(false); // Free & unlimited

  const fileBytes = await fs.readFile(inputPath);

  // Load with password
  let pdf: PDFDocument;
  try {
    pdf = await (PDFDocument as any).load(fileBytes, { password });
  } catch (err: any) {
    throw new Error(`Failed to unlock PDF: ${err.message || "Incorrect password or corrupt file."}`);
  }

  // Saving without calling encrypt writes an unencrypted PDF file
  const outputBytes = await pdf.save();
  await fs.writeFile(outputPath, outputBytes);

  return {
    success: true,
    outputPath,
    pageCount: pdf.getPageCount(),
    message: "PDF successfully unlocked and password protection removed.",
  };
}
