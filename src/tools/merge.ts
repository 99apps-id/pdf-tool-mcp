import * as fs from "node:fs/promises";
import { PDFDocument } from "@cantoo/pdf-lib";
import { checkToolQuota } from "../auth.js";

export async function mergePdfs(inputPaths: string[], outputPath: string) {
  await checkToolQuota(false); // Free & unlimited

  if (inputPaths.length < 2) {
    throw new Error("At least 2 PDF file paths are required to merge.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const filePath of inputPaths) {
    const fileBytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  const mergedBytes = await mergedPdf.save();
  await fs.writeFile(outputPath, mergedBytes);

  return {
    success: true,
    pageCount: mergedPdf.getPageCount(),
    outputPath,
    inputFiles: inputPaths,
  };
}
