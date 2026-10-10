import { createPdfMcpServer } from "./server.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

async function test() {
  console.log("Initializing MCP Server...");
  const server = createPdfMcpServer();

  const listToolsHandler = (server as any)._requestHandlers?.get(ListToolsRequestSchema.shape.method.value);
  if (!listToolsHandler) {
    throw new Error("ListTools handler not found!");
  }

  const res = await listToolsHandler({ method: "tools/list" });
  console.log(`\nRegistered ${res.tools.length} MCP Tools:`);
  for (const t of res.tools) {
    console.log(` ✅ [${t.name}]: ${t.description.slice(0, 75)}...`);
  }

  if (res.tools.length === 10) {
    console.log("\nAll 10 MCP Tools registered and validated successfully! 🚀\n");
  } else {
    throw new Error(`Expected 10 tools, found ${res.tools.length}`);
  }
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
