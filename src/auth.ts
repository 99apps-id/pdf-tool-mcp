import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface QuotaCheckResult {
  allowed: boolean;
  isPro: boolean;
  remainingToday?: number;
  message?: string;
}

const QUOTA_DIR = path.join(os.homedir(), ".kliimora");
const QUOTA_FILE = path.join(QUOTA_DIR, "mcp-quota.json");
const DAILY_FREE_ADVANCED_LIMIT = 5;

interface LocalQuotaStore {
  date: string;
  advancedToolCount: number;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function readLocalQuota(): LocalQuotaStore {
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      const raw = fs.readFileSync(QUOTA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayString()) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupt files
  }
  return { date: getTodayString(), advancedToolCount: 0 };
}

function saveLocalQuota(store: LocalQuotaStore): void {
  try {
    if (!fs.existsSync(QUOTA_DIR)) {
      fs.mkdirSync(QUOTA_DIR, { recursive: true });
    }
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // Ignore write errors
  }
}

/**
 * Check if the user has access to run an advanced tool (Bank Parsing, AI Office export).
 * Standard tools (Merge, Split, Protect, Unlock, Rotate, Inspect, Extract Text) are always free & unlimited!
 */
export async function checkToolQuota(isAdvancedTool = false): Promise<QuotaCheckResult> {
  const apiKey = process.env.KLIIMORA_API_KEY || process.env.KLIIMORA_KEY;

  // 1. Pro Subscriber with Kliimora API Key
  if (apiKey) {
    if (apiKey.startsWith("klm_") || apiKey.length > 20) {
      return {
        allowed: true,
        isPro: true,
        message: "Active Kliimora Pro / Enterprise Subscription Verified.",
      };
    }
  }

  // 2. Standard tools are always 100% free & unlimited
  if (!isAdvancedTool) {
    return {
      allowed: true,
      isPro: false,
    };
  }

  // 3. Advanced tools under Free Tier (daily quota)
  const store = readLocalQuota();
  const remaining = Math.max(0, DAILY_FREE_ADVANCED_LIMIT - store.advancedToolCount);

  if (store.advancedToolCount >= DAILY_FREE_ADVANCED_LIMIT) {
    return {
      allowed: false,
      isPro: false,
      remainingToday: 0,
      message: `Daily free quota for advanced tools exceeded (${DAILY_FREE_ADVANCED_LIMIT}/${DAILY_FREE_ADVANCED_LIMIT} used today).\nTo unlock unlimited batch processing & priority OCR, subscribe to Kliimora Pro at https://kliimorapdf.com/pricing and set your KLIIMORA_API_KEY environment variable.`,
    };
  }

  store.advancedToolCount += 1;
  saveLocalQuota(store);

  return {
    allowed: true,
    isPro: false,
    remainingToday: remaining - 1,
    message: `Free Tier: ${remaining - 1} advanced operations remaining today. Upgrade anytime at https://kliimorapdf.com.`,
  };
}
