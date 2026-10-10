import * as fs from "node:fs/promises";
import type { PageText, TextItem, PdfMetadata } from "./types.js";

async function getPdfJs() {
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    try {
      const mod: any = await import("dommatrix");
      (globalThis as any).DOMMatrix = mod.default ?? mod.DOMMatrix ?? mod;
    } catch {
      // Ignore if dommatrix is already available or polyfilled
    }
  }
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-worker-disabled";
  }
  return pdfjs;
}

export async function extractPdfPages(filePath: string, password?: string): Promise<PageText[]> {
  const fileBuffer = await fs.readFile(filePath);
  const pdfjs = await getPdfJs();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fileBuffer),
    password,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pages: PageText[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items: TextItem[] = textContent.items.map((it: any) => ({
      str: it.str || "",
      x: it.transform ? it.transform[4] : 0,
      y: it.transform ? viewport.height - it.transform[5] : 0,
      w: it.width ?? 0,
      h: it.height ?? (it.transform ? Math.abs(it.transform[3]) : 10),
    }));

    pages.push({
      items,
      width: viewport.width,
      height: viewport.height,
      pageNumber: i,
    });
  }

  return pages;
}

export async function inspectPdfFile(filePath: string): Promise<PdfMetadata> {
  const stat = await fs.stat(filePath);
  const fileBuffer = await fs.readFile(filePath);
  const pdfjs = await getPdfJs();

  let isEncrypted = false;
  let pageCount = 0;
  let info: any = {};

  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(fileBuffer),
      disableWorker: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;
    pageCount = pdf.numPages;
    const metadata = await pdf.getMetadata();
    info = metadata.info || {};
  } catch (err: any) {
    if (err?.name === "PasswordException") {
      isEncrypted = true;
    } else {
      throw err;
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return {
    pageCount,
    title: info.Title || undefined,
    author: info.Author || undefined,
    subject: info.Subject || undefined,
    creator: info.Creator || undefined,
    producer: info.Producer || undefined,
    creationDate: info.CreationDate || undefined,
    modificationDate: info.ModDate || undefined,
    isEncrypted,
    fileSizeBytes: stat.size,
    fileSizeFormatted: formatBytes(stat.size),
  };
}
