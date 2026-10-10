import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tool functions
import { mergePdfs } from "./tools/merge.js";
import { splitPdf } from "./tools/split.js";
import { rotatePdf } from "./tools/rotate.js";
import { protectPdf } from "./tools/protect.js";
import { unlockPdf } from "./tools/unlock.js";
import { inspectPdf } from "./tools/inspect.js";
import { extractTextFromPdf } from "./tools/text.js";
import { parseBankStatementTool } from "./tools/bank-statement.js";
import { exportToExcel } from "./tools/export-excel.js";
import { exportToWord } from "./tools/export-word.js";

export function createPdfMcpServer(): Server {
  const server = new Server(
    {
      name: "kliimora-pdf-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // 1. List Available Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "pdf_inspect",
          description:
            "Inspect PDF metadata including page count, encryption status, author, title, creation date, and file size.",
          inputSchema: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "Absolute or relative path to the PDF file.",
              },
            },
            required: ["filePath"],
          },
        },
        {
          name: "pdf_extract_text",
          description:
            "Extract clean text from a PDF file, either for the entire document or a specific page.",
          inputSchema: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "Path to the PDF file.",
              },
              password: {
                type: "string",
                description: "Password if the PDF is password-protected.",
              },
              pageNumber: {
                type: "number",
                description: "Optional 1-based page number to extract only that page.",
              },
            },
            required: ["filePath"],
          },
        },
        {
          name: "pdf_parse_bank_statement",
          description:
            "Parse Indonesian & international bank statements (BCA, Mandiri, BNI, BRI, Bank Jatim, Bank Mega, Bank Jago, SeaBank, DBS, auto-detect) into structured transaction data (date, description, debit, credit, balance).",
          inputSchema: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "Path to the bank statement PDF file.",
              },
              bankHint: {
                type: "string",
                enum: [
                  "auto",
                  "bca",
                  "mandiri",
                  "bni",
                  "bri",
                  "jatim",
                  "mega",
                  "jago",
                  "seabank",
                  "dbs",
                ],
                description:
                  "Bank code hint. Leave as 'auto' to automatically detect the issuing bank.",
              },
              password: {
                type: "string",
                description: "Password if the statement is protected (e.g. date of birth / PIN).",
              },
            },
            required: ["filePath"],
          },
        },
        {
          name: "pdf_merge",
          description: "Merge two or more PDF files into a single output PDF document.",
          inputSchema: {
            type: "object",
            properties: {
              inputPaths: {
                type: "array",
                items: { type: "string" },
                description: "List of PDF file paths in the order to merge.",
              },
              outputPath: {
                type: "string",
                description: "Destination file path for the merged PDF.",
              },
            },
            required: ["inputPaths", "outputPath"],
          },
        },
        {
          name: "pdf_split",
          description:
            "Split or extract specific pages/ranges from a PDF (e.g. '1-3, 5, 8-10') into a new PDF.",
          inputSchema: {
            type: "object",
            properties: {
              inputPath: {
                type: "string",
                description: "Source PDF file path.",
              },
              pageRanges: {
                type: "string",
                description: "Page range string, e.g. '1-3, 5, 8-10'.",
              },
              outputPath: {
                type: "string",
                description: "Destination file path for extracted pages.",
              },
            },
            required: ["inputPath", "pageRanges", "outputPath"],
          },
        },
        {
          name: "pdf_rotate",
          description: "Rotate PDF pages by 90, 180, or 270 degrees.",
          inputSchema: {
            type: "object",
            properties: {
              inputPath: {
                type: "string",
                description: "Source PDF file path.",
              },
              angle: {
                type: "string",
                enum: ["90", "180", "270"],
                description:
                  "Clockwise rotation angle in degrees as a string (90, 180, or 270).",
              },
              outputPath: {
                type: "string",
                description: "Destination file path.",
              },
              pageRanges: {
                type: "string",
                description: "Optional page range to rotate (e.g. '1, 3-5'). Defaults to all pages.",
              },
            },
            required: ["inputPath", "angle", "outputPath"],
          },
        },
        {
          name: "pdf_protect",
          description:
            "Protect and encrypt a PDF with password (prevents opening without password).",
          inputSchema: {
            type: "object",
            properties: {
              inputPath: {
                type: "string",
                description: "Source PDF file path.",
              },
              password: {
                type: "string",
                description: "Password to lock the PDF (min 4 characters).",
              },
              outputPath: {
                type: "string",
                description: "Destination file path for protected PDF.",
              },
              ownerPassword: {
                type: "string",
                description: "Optional owner password for permission configuration.",
              },
            },
            required: ["inputPath", "password", "outputPath"],
          },
        },
        {
          name: "pdf_unlock",
          description:
            "Remove password protection from an encrypted PDF file using its password.",
          inputSchema: {
            type: "object",
            properties: {
              inputPath: {
                type: "string",
                description: "Protected PDF file path.",
              },
              password: {
                type: "string",
                description: "Password of the PDF.",
              },
              outputPath: {
                type: "string",
                description: "Destination file path for unlocked PDF.",
              },
            },
            required: ["inputPath", "password", "outputPath"],
          },
        },
        {
          name: "pdf_export_excel",
          description:
            "Export parsed bank transactions or financial tables to a formatted Microsoft Excel (.xlsx) spreadsheet with formulas and color-coded Debits/Credits.",
          inputSchema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                description: "List of transactions (e.g. from pdf_parse_bank_statement).",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    description: { type: "string" },
                    type: { type: "string", enum: ["DB", "CR"] },
                    amount: { type: "number" },
                    balance: { type: "number" },
                  },
                  required: ["date", "description", "type", "amount"],
                },
              },
              outputPath: {
                type: "string",
                description: "Destination path for the .xlsx file.",
              },
              accountInfo: {
                type: "object",
                properties: {
                  bank: { type: "string" },
                  accountNumber: { type: "string" },
                  accountName: { type: "string" },
                  period: { type: "string" },
                },
              },
            },
            required: ["transactions", "outputPath"],
          },
        },
        {
          name: "pdf_export_word",
          description:
            "Export extracted text or paragraphs to a clean Microsoft Word (.docx) document.",
          inputSchema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Text content or paragraphs separated by double newlines.",
              },
              outputPath: {
                type: "string",
                description: "Destination path for the .docx file.",
              },
            },
            required: ["content", "outputPath"],
          },
        },
      ],
    };
  });

  // 2. Call Tool Handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      switch (name) {
        case "pdf_inspect":
          result = await inspectPdf(args?.filePath as string);
          break;

        case "pdf_extract_text":
          result = await extractTextFromPdf(
            args?.filePath as string,
            args?.password as string | undefined,
            args?.pageNumber as number | undefined,
          );
          break;

        case "pdf_parse_bank_statement":
          result = await parseBankStatementTool(
            args?.filePath as string,
            (args?.bankHint as any) || "auto",
            args?.password as string | undefined,
          );
          break;

        case "pdf_merge":
          result = await mergePdfs(args?.inputPaths as string[], args?.outputPath as string);
          break;

        case "pdf_split":
          result = await splitPdf(
            args?.inputPath as string,
            args?.pageRanges as string,
            args?.outputPath as string,
          );
          break;

        case "pdf_rotate":
          result = await rotatePdf(
            args?.inputPath as string,
            Number(args?.angle),
            args?.outputPath as string,
            args?.pageRanges as string | undefined,
          );
          break;

        case "pdf_protect":
          result = await protectPdf(
            args?.inputPath as string,
            args?.password as string,
            args?.outputPath as string,
            args?.ownerPassword as string | undefined,
          );
          break;

        case "pdf_unlock":
          result = await unlockPdf(
            args?.inputPath as string,
            args?.password as string,
            args?.outputPath as string,
          );
          break;

        case "pdf_export_excel":
          result = await exportToExcel(
            args?.transactions as any,
            args?.outputPath as string,
            args?.accountInfo as any,
          );
          break;

        case "pdf_export_word":
          result = await exportToWord(args?.content as string, args?.outputPath as string);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Tool Execution Error [${name}]: ${err.message || String(err)}`,
          },
        ],
      };
    }
  });

  return server;
}
