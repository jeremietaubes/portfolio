import { Client } from "@notionhq/client";
import type { CaseStudy, ContentBlock } from "@/types/case-study";

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });

function richTextToString(richText: any[]): string {
  return richText.map((t: any) => t.plain_text).join("");
}

// Preserves bold and italic annotations as HTML
function richTextToHtml(richText: any[]): string {
  return richText.map((t: any) => {
    let text = t.plain_text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    if (t.annotations?.bold) text = `<strong>${text}</strong>`;
    if (t.annotations?.italic) text = `<em>${text}</em>`;
    return text;
  }).join("");
}

function parseBlocks(blocks: any[]): ContentBlock[] {
  const result: ContentBlock[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading_2":
      case "heading_3": {
        const text = richTextToString(block[block.type].rich_text);
        if (text) result.push({ type: "heading", text });
        break;
      }
      case "callout": {
        const text = richTextToString(block.callout.rich_text);
        if (text) result.push({ type: "subtitle", text });
        break;
      }
      case "paragraph": {
        const html = richTextToHtml(block.paragraph.rich_text);
        if (html) result.push({ type: "paragraph", text: html });
        break;
      }
      case "quote": {
        const text = richTextToString(block.quote.rich_text);
        if (text) result.push({ type: "quote", text });
        break;
      }
      case "bulleted_list_item": {
        const html = richTextToHtml(block.bulleted_list_item.rich_text);
        if (!html) break;
        const last = result[result.length - 1];
        if (last?.type === "bullet_list") {
          last.items.push(html);
        } else {
          result.push({ type: "bullet_list", items: [html] });
        }
        break;
      }
      case "numbered_list_item": {
        const html = richTextToHtml(block.numbered_list_item.rich_text);
        if (!html) break;
        const last = result[result.length - 1];
        if (last?.type === "numbered_list") {
          last.items.push(html);
        } else {
          result.push({ type: "numbered_list", items: [html] });
        }
        break;
      }
      case "image": {
        const alt = richTextToString(block.image.caption);
        const url = alt
          ? `/images/${alt}`
          : block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;
        result.push({ type: "image", url, alt });
        break;
      }
    }
  }

  return result;
}

export async function getContentById(id: string): Promise<ContentBlock[]> {
  if (!import.meta.env.NOTION_API_KEY) return [];
  try {
    const res = await notion.blocks.children.list({ block_id: id });
    return parseBlocks(res.results);
  } catch {
    return [];
  }
}
