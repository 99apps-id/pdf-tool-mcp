import { inspectPdfFile } from "../lib/pdf-parser.js";
import { checkToolQuota } from "../auth.js";

export async function inspectPdf(filePath: string) {
  await checkToolQuota(false); // Free & unlimited
  const metadata = await inspectPdfFile(filePath);
  return {
    success: true,
    filePath,
    ...metadata,
  };
}
