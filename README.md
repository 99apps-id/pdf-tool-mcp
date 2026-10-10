# 📄 PDF Tool MCP Server (`@99apps/pdf-tool-mcp`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Version](https://img.shields.io/badge/MCP-1.6.0-green.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Powered by Kliimora](https://img.shields.io/badge/Engine-Kliimora%20PDF-purple.svg)](https://kliimorapdf.com/mcp-tool)

A high-performance, developer-grade [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that empowers AI assistants (**Claude Desktop, Cursor, Termigo, Windsurf, Zed, and custom AI agents**) with native PDF manipulation, banking statement extraction, document conversion, and security tools.

---

## 🚀 Key Features

* **🏦 Indonesian & International Bank Statement Parser**:
  * Parse complex e-statements / rekening koran from **BCA, Mandiri (Livin/Kopra/CMS), BNI, BRI, Bank Jatim, Bank Mega, Bank Jago, SeaBank, DBS**, and international statements.
  * Extracts structured JSON arrays: `date`, `description`, `type (DB/CR)`, `amount`, and `running balance`.
* **📊 Office Document Generators**:
  * **Export to Excel (`.xlsx`)**: Auto-formatted transaction tables with color-coded Debits/Credits, numerical formats, and headers.
  * **Export to Word (`.docx`)**: Extract text flow and generate native Word documents.
* **🔒 Enterprise PDF Security**:
  * **Password Protect (`pdf_protect`)**: Encrypt PDF files with 256-bit AES protection.
  * **Password Unlock (`pdf_unlock`)**: Remove passwords and decrypt documents.
* **✂️ Page Manipulation**:
  * **Merge (`pdf_merge`)**: Combine multiple PDF files into one.
  * **Split / Extract (`pdf_split`)**: Extract arbitrary page ranges (e.g. `1-3, 5, 8-10`).
  * **Rotate (`pdf_rotate`)**: Rotate landscape/portrait pages by 90, 180, or 270 degrees.
* **🔍 Deep Metadata & Text Inspection**:
  * **Inspect (`pdf_inspect`)**: Check page counts, encryption status, creator, and file sizes.
  * **Text Extraction (`pdf_extract_text`)**: Clean text extraction per page or full document.

---

## 📦 Quick Start & Installation

You can run this MCP server directly via `npx` without manual installation, or clone and build it locally.

### 1. Claude Desktop Setup

Add the following to your `claude_desktop_config.json`:

* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "npx",
      "args": ["-y", "@99apps/pdf-tool-mcp"],
      "env": {
        "KLIIMORA_API_KEY": "klm_live_optional_pro_max_key"
      }
    }
  }
}
```

---

### 2. Cursor Setup

Add the following to `.cursor/mcp.json` in your workspace:

```json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "npx",
      "args": ["-y", "@99apps/pdf-tool-mcp"],
      "env": {
        "KLIIMORA_API_KEY": "klm_live_optional_pro_max_key"
      }
    }
  }
}
```

---

### 3. Termigo & CLI Setup

In your agent's MCP settings or terminal session:

```json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "npx",
      "args": ["-y", "@99apps/pdf-tool-mcp"]
    }
  }
}
```

---

## 🛠️ Available MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `pdf_parse_bank_statement` | `filePath`, `bankHint`, `password` | Parse BCA, Mandiri, BNI, BRI, Jatim, Mega, Jago, SeaBank e-statements to JSON. |
| `pdf_export_excel` | `transactions`, `outputPath`, `accountInfo` | Export parsed transactions into a styled Microsoft Excel (`.xlsx`) sheet. |
| `pdf_export_word` | `content`, `outputPath` | Export text or document paragraphs into Microsoft Word (`.docx`). |
| `pdf_merge` | `inputPaths`, `outputPath` | Merge two or more PDF files into a single document. |
| `pdf_split` | `inputPath`, `pageRanges`, `outputPath` | Extract specific pages or ranges (e.g. `'1-3, 5'`). |
| `pdf_rotate` | `inputPath`, `angle`, `outputPath`, `pageRanges` | Rotate pages by 90, 180, or 270 degrees clockwise. |
| `pdf_protect` | `inputPath`, `password`, `outputPath` | Encrypt PDF with password protection. |
| `pdf_unlock` | `inputPath`, `password`, `outputPath` | Decrypt and remove password from protected PDF. |
| `pdf_inspect` | `filePath` | Retrieve page count, encryption status, metadata, and file size. |
| `pdf_extract_text` | `filePath`, `password`, `pageNumber` | Extract plain text from all or specific pages. |

---

## 💳 Fair-Use Policy & Subscription Tiers

This MCP server is designed with an open developer model:

### 1. Community & Open-Source Tier (100% Free)
* **Standard Operations**: `pdf_merge`, `pdf_split`, `pdf_rotate`, `pdf_protect`, `pdf_unlock`, `pdf_inspect`, `pdf_extract_text`, and `pdf_export_word` are **100% free with unlimited local execution**. All operations run strictly on your machine.
* **Bank Statement Parser**: Includes **5 free parses per day** per machine for testing and light personal usage.

### 2. Kliimora Pro Max Tier ($35/mo)
* API Key access and webhook automation are exclusive privileges of **[Kliimora Pro Max](https://kliimorapdf.com/pricing)** subscribers.
* **Pro Max Benefits**:
  * Up to **1,200 pages per month** with zero daily throttle.
  * Direct API Key integration for automated data pipelines, n8n, Zapier, and autonomous multi-statement financial reconciliations.
  * High-accuracy OCR fallback for scanned receipts and paper invoices.
* Supply your key via environment variable:
  ```bash
  export KLIIMORA_API_KEY="klm_live_xxxxxxxxxxxx"
  ```

---

## 🧑‍💻 Local Development & Build

```bash
# 1. Clone repository
git clone https://github.com/99apps-id/pdf-tool-mcp.git
cd pdf-tool-mcp

# 2. Install dependencies
pnpm install

# 3. Build bundle
pnpm run build

# 4. Test run with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 📄 License

MIT License © 2026 PT Naracitra Solusindo / 99apps-id.  
Powered by the document processing engines of [Kliimora PDF](https://kliimorapdf.com).
