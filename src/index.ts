import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPdfMcpServer } from "./server.js";

async function main() {
  const server = createPdfMcpServer();
  const transport = new StdioServerTransport();

  // Handle process termination cleanly
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error("Kliimora PDF MCP Server running on stdio transport.");
}

main().catch((error) => {
  console.error("Fatal error running PDF MCP Server:", error);
  process.exit(1);
});
