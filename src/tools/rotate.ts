import * as fs from "node:fs/promises";
import { PDFDocument, degrees } from "@cantoo/pdf-lib";
import { checkToolQuota } from "../auth.js";

export async function rotatePdf(inputPath: string, angle: number, outputPath: string, pageRanges?: string) {
  await checkToolQuota(false); // Free & unlimited

  const fileBytes = await fs.readFile(inputPath);
  const pdf = await PDFDocument.load(fileBytes);
  const totalPages = pdf.getPageCount();

  const validAngle = ((angle % 360) + 360) % 360;
  if (![90, 180, 270].includes(validAngle)) {
    throw new Error(`Invalid rotation angle: ${angle}. Allowed values are 90, 180, 270.`);
  }

  let targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  if (pageRanges) {
    const parts = pageRanges.split(",").map((p) => p.trim());
    const subset = new Set<number>();
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((s) => parseInt(s.trim(), 10));
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) subset.add(i - 1);
        }
      } else {
        const p = parseInt(part, 10);
        if (p >= 1 && p <= totalPages) subset.add(p - 1);
      }
    }
    targetIndices = Array.from(subset);
  }

  for (const idx of targetIndices) {
    const page = pdf.getPage(idx);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + validAngle) % 360));
  }

  const outputBytes = await pdf.save();
  await fs.writeFile(outputPath, outputBytes);

  return {
    success: true,
    pageCount: totalPages,
    rotatedPages: targetIndices.length,
    angle: validAngle,
    outputPath,
  };
}
