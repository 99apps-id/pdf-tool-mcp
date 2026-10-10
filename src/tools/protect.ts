import * as fs from "node:fs/promises";
import { PDFDocument } from "@cantoo/pdf-lib";
import { checkToolQuota } from "../auth.js";

export async function protectPdf(
  inputPath: string,
  userPassword: string,
  outputPath: string,
  ownerPassword?: string,
) {
  await checkToolQuota(false); // Free & unlimited

  if (!userPassword || userPassword.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }

  const fileBytes = await fs.readFile(inputPath);
  const pdf = await PDFDocument.load(fileBytes);

  pdf.encrypt({
    userPassword,
    ownerPassword: ownerPassword || userPassword,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: true,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  const outputBytes = await pdf.save();
  await fs.writeFile(outputPath, outputBytes);

  return {
    success: true,
    outputPath,
    pageCount: pdf.getPageCount(),
    message: "PDF successfully encrypted with password protection.",
  };
}
