import * as fs from "node:fs/promises";
import { PDFDocument } from "@cantoo/pdf-lib";
import { checkToolQuota } from "../auth.js";

function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(",").map((p) => p.trim());

  for (const part of parts) {
    if (!part) continue;
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i - 1); // 0-indexed
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export async function splitPdf(inputPath: string, pageRanges: string, outputPath: string) {
  await checkToolQuota(false); // Free & unlimited

  const fileBytes = await fs.readFile(inputPath);
  const srcPdf = await PDFDocument.load(fileBytes);
  const totalPages = srcPdf.getPageCount();

  const selectedIndices = parsePageRanges(pageRanges, totalPages);
  if (selectedIndices.length === 0) {
    throw new Error(`No valid pages found in range "${pageRanges}". Document has ${totalPages} pages.`);
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, selectedIndices);
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  const outputBytes = await newPdf.save();
  await fs.writeFile(outputPath, outputBytes);

  return {
    success: true,
    originalPageCount: totalPages,
    extractedPageCount: newPdf.getPageCount(),
    pageRanges,
    outputPath,
  };
}
