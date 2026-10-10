import * as fs from "node:fs/promises";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { checkToolQuota } from "../auth.js";

export async function exportToWord(
  content: string | { title?: string; paragraphs: string[] },
  outputPath: string,
) {
  await checkToolQuota(false); // Free & unlimited

  const title = typeof content === "object" ? content.title : "Extracted Document";
  const textParagraphs =
    typeof content === "object"
      ? content.paragraphs
      : content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const docChildren: Paragraph[] = [];

  if (title) {
    docChildren.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 300 },
      }),
    );
  }

  for (const paraText of textParagraphs) {
    docChildren.push(
      new Paragraph({
        children: [new TextRun(paraText.trim())],
        spacing: { after: 200, line: 360 },
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);

  return {
    success: true,
    paragraphCount: textParagraphs.length,
    outputPath,
    message: `Successfully exported ${textParagraphs.length} paragraphs to Word (.docx) document.`,
  };
}
