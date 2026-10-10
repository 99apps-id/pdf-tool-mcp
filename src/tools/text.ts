import { extractPdfPages } from "../lib/pdf-parser.js";
import { checkToolQuota } from "../auth.js";

export async function extractTextFromPdf(filePath: string, password?: string, pageNumber?: number) {
  await checkToolQuota(false); // Free & unlimited

  const pages = await extractPdfPages(filePath, password);

  if (pageNumber && pageNumber >= 1 && pageNumber <= pages.length) {
    const p = pages[pageNumber - 1];
    const text = p.items.map((i) => i.str).join(" ");
    return {
      success: true,
      totalPages: pages.length,
      pageNumber,
      text,
    };
  }

  const extractedPages = pages.map((p) => ({
    pageNumber: p.pageNumber,
    itemCount: p.items.length,
    text: p.items.map((i) => i.str).join(" "),
  }));

  const fullText = extractedPages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n");

  return {
    success: true,
    totalPages: pages.length,
    fullText,
    pages: extractedPages,
  };
}
