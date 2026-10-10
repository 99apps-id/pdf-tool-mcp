import { extractPdfPages } from "../lib/pdf-parser.js";
import { parseBankStatement } from "../lib/bank-parser.js";
import type { BankName } from "../lib/types.js";
import { checkToolQuota } from "../auth.js";

export async function parseBankStatementTool(
  filePath: string,
  bankHint: BankName = "auto",
  password?: string,
) {
  // Advanced tool: check daily quota or Kliimora Pro API key
  const quota = await checkToolQuota(true);
  if (!quota.allowed) {
    throw new Error(quota.message);
  }

  const pages = await extractPdfPages(filePath, password);
  const result = parseBankStatement(pages, bankHint);

  return {
    success: true,
    ...result,
    quotaInfo: quota.message,
  };
}
