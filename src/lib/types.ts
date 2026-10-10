export type BankName =
  | "bca"
  | "mandiri"
  | "bni"
  | "bri"
  | "jatim"
  | "mega"
  | "jago"
  | "seabank"
  | "dbs"
  | "auto";

export interface BankTransaction {
  date: string;
  description: string;
  type: "DB" | "CR";
  amount: number;
  balance?: number;
  raw?: string;
}

export interface BankParseResult {
  bank: string;
  accountNumber?: string;
  accountName?: string;
  period?: string;
  openingBalance?: number;
  closingBalance?: number;
  totalDebit?: number;
  totalCredit?: number;
  transactions: BankTransaction[];
  confidence: number;
}

export interface TextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageText {
  items: TextItem[];
  width: number;
  height: number;
  pageNumber: number;
}

export interface PdfMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  isEncrypted: boolean;
  fileSizeBytes: number;
  fileSizeFormatted: string;
}
