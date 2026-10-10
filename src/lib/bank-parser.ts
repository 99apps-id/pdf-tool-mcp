import type { PageText, BankParseResult, BankTransaction, BankName, TextItem } from "./types.js";

// Helper to group items by approximate horizontal line (Y-coordinate clustering)
function clusterLines(items: TextItem[], yTolerance = 3.5): TextItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: TextItem[][] = [];

  for (const item of sorted) {
    if (!item.str.trim()) continue;
    const lastLine = lines[lines.length - 1];
    if (lastLine && Math.abs(lastLine[0].y - item.y) <= yTolerance) {
      lastLine.push(item);
      lastLine.sort((a, b) => a.x - b.x);
    } else {
      lines.push([item]);
    }
  }

  return lines;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  let clean = raw.trim().replace(/[^0-9,.-]/g, "");
  // Handle Indonesian currency format e.g. 1.250.000,50 -> 1250000.50
  if (clean.includes(".") && clean.includes(",")) {
    if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(",")) {
    // If only comma exists: e.g. 50,000 (US) or 50,00 (ID)
    const parts = clean.split(",");
    if (parts.length === 2 && parts[1].length === 2) {
      clean = clean.replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  } else if ((clean.match(/\./g) || []).length > 1) {
    // Multiple dots: 1.000.000
    clean = clean.replace(/\./g, "");
  }
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.abs(val);
}

// Auto-detect bank from full text
export function detectBank(pages: PageText[]): BankName {
  const allText = pages
    .flatMap((p) => p.items.map((i) => i.str))
    .join(" ")
    .toUpperCase();

  if (allText.includes("BANK CENTRAL ASIA") || allText.includes("BCA") || allText.includes("TAHAPAN")) return "bca";
  if (allText.includes("BANK MANDIRI") || allText.includes("LIVIN") || allText.includes("MANDIRI")) return "mandiri";
  if (allText.includes("BANK NEGARA INDONESIA") || allText.includes("BNI")) return "bni";
  if (allText.includes("BANK RAKYAT INDONESIA") || allText.includes("BRIMO") || allText.includes("BRI")) return "bri";
  if (allText.includes("BANK JATIM") || allText.includes("BPD JAWA TIMUR")) return "jatim";
  if (allText.includes("BANK MEGA")) return "mega";
  if (allText.includes("BANK JAGO") || allText.includes("PT BANK JAGO")) return "jago";
  if (allText.includes("SEABANK") || allText.includes("SEA BANK")) return "seabank";
  if (allText.includes("DBS BANK") || allText.includes("DIGIBANK")) return "dbs";

  return "auto";
}

export function parseBankStatement(pages: PageText[], hint: BankName = "auto"): BankParseResult {
  const bank = hint === "auto" ? detectBank(pages) : hint;
  const transactions: BankTransaction[] = [];

  let totalDebit = 0;
  let totalCredit = 0;
  let openingBalance: number | undefined;
  let closingBalance: number | undefined;
  let accountNumber: string | undefined;
  let accountName: string | undefined;
  let period: string | undefined;

  // Pattern matchers
  const datePattern = /(\b\d{2}[/-]\d{2}(?:[/-]\d{2,4})?\b|\b\d{2}\s+(?:JAN|FEB|MAR|APR|MEI|MAY|JUN|JUL|AGU|AUG|SEP|OKT|OCT|NOV|DES|DEC)[a-z]*\s+\d{2,4}\b)/i;
  const amountPattern = /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/;

  for (const page of pages) {
    const lines = clusterLines(page.items);

    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i].map((it) => it.str).join(" ").trim();

      // Extract metadata
      if (!accountNumber) {
        const accMatch = lineStr.match(/(?:NO\.?\s*REK(?:ENING)?|ACCOUNT\s*NO\.?)\s*[:]?\s*([0-9-]+)/i);
        if (accMatch) accountNumber = accMatch[1];
      }
      if (!period) {
        const perMatch = lineStr.match(/(?:PERIODE|PERIOD)\s*[:]?\s*([^,\n]+)/i);
        if (perMatch) period = perMatch[1].trim();
      }
      if (!accountName) {
        const nameMatch = lineStr.match(/(?:NAMA|NAME)\s*[:]?\s*([A-Z\s.,]{3,35})/i);
        if (nameMatch && !nameMatch[1].includes("BANK") && !nameMatch[1].includes("HALAMAN")) {
          accountName = nameMatch[1].trim();
        }
      }

      // Check for balances
      if (lineStr.match(/SALDO\s*AWAL|OPENING\s*BALANCE/i)) {
        const amt = lineStr.match(amountPattern);
        if (amt) openingBalance = parseAmount(amt[1]);
      }
      if (lineStr.match(/SALDO\s*AKHIR|CLOSING\s*BALANCE/i)) {
        const amt = lineStr.match(amountPattern);
        if (amt) closingBalance = parseAmount(amt[1]);
      }

      // Check for transaction line: starts or contains a date
      const dateMatch = lineStr.match(datePattern);
      if (dateMatch) {
        // Line candidate
        const date = dateMatch[1];
        const isDb = /\b(DB|DR|DEBIT|D)\b/i.test(lineStr) || /-\s*[0-9]/.test(lineStr);
        const isCr = /\b(CR|KREDIT|CREDIT|C)\b/i.test(lineStr) || /\+\s*[0-9]/.test(lineStr);

        // Find numbers in line
        const amounts = [...lineStr.matchAll(new RegExp(amountPattern, "g"))]
          .map((m) => parseAmount(m[1]))
          .filter((v) => v > 0);

        if (amounts.length > 0) {
          const transAmount = amounts[0];
          const transType: "DB" | "CR" = isDb ? "DB" : isCr ? "CR" : "CR";
          const transBalance = amounts.length > 1 ? amounts[amounts.length - 1] : undefined;

          // Description cleanup
          let desc = lineStr
            .replace(dateMatch[0], "")
            .replace(/\b(DB|DR|CR|DEBIT|KREDIT)\b/gi, "")
            .replace(new RegExp(amountPattern, "g"), "")
            .replace(/\s+/g, " ")
            .trim();

          // If next line is a continuation description (no date, no amount)
          if (i + 1 < lines.length) {
            const nextLineStr = lines[i + 1].map((it) => it.str).join(" ").trim();
            if (!nextLineStr.match(datePattern) && !nextLineStr.match(/\b\d{1,3}(?:[.,]\d{3}){1,3}\b/)) {
              if (nextLineStr.length < 100 && !nextLineStr.match(/SALDO|HALAMAN|PAGE/i)) {
                desc += " " + nextLineStr;
                i++;
              }
            }
          }

          if (transType === "DB") totalDebit += transAmount;
          else totalCredit += transAmount;

          transactions.push({
            date,
            description: desc || "Transaksi",
            type: transType,
            amount: transAmount,
            balance: transBalance,
            raw: lineStr,
          });
        }
      }
    }
  }

  return {
    bank: bank.toUpperCase(),
    accountNumber,
    accountName,
    period,
    openingBalance,
    closingBalance,
    totalDebit,
    totalCredit,
    transactions,
    confidence: transactions.length > 0 ? 0.95 : 0.4,
  };
}
