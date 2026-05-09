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
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    if (t.annotations?.bold) text = `<strong>${text}</strong>`;
    if (t.annotations?.italic) text = `<em>${text}</em>`;
    return text;
  }).join("");
}

async function fetchChildren(blockId: string): Promise<any[]> {
  try {
    const results: any[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
      results.push(...res.results);
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return results;
  } catch {
    return [];
  }
}

async function parseBlocks(blocks: any[]): Promise<ContentBlock[]> {
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
        const plain = richTextToString(block.callout.rich_text).trim();
        if (plain.startsWith("[supertitle]")) {
          result.push({ type: "subtitle", text: plain.replace("[supertitle]", "").trim() });
          break;
        }
        const emoji = block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : undefined;
        let text = richTextToHtml(block.callout.rich_text);
        if (block.has_children) {
          const children = await fetchChildren(block.id);
          const listItems = children
            .filter((c: any) => c.type === "bulleted_list_item" || c.type === "numbered_list_item")
            .map((c: any) => {
              const key = c.type === "bulleted_list_item" ? "bulleted_list_item" : "numbered_list_item";
              return `<li>${richTextToHtml(c[key].rich_text)}</li>`;
            })
            .join("");
          if (listItems) text += `<ul class="callout-list">${listItems}</ul>`;
        }
        if (text) result.push({ type: "callout", text, emoji });
        break;
      }
      case "paragraph": {
        const plain = richTextToString(block.paragraph.rich_text).trim();
        const match = plain.match(/^>>(\d+)\s*([\s\S]*)$/);
        if (match) {
          const num = match[1];
          const html = richTextToHtml(block.paragraph.rich_text);
          const textHtml = html.replace(/^(<(?:strong|em|b|i)[^>]*>)?&gt;&gt;\d+\s*/, '$1');
          result.push({ type: "numbered_item", num, text: textHtml });
        } else {
          const html = richTextToHtml(block.paragraph.rich_text);
          if (html) result.push({ type: "paragraph", text: html });
        }
        break;
      }
      case "quote": {
        let text = richTextToString(block.quote.rich_text);
        if (!text && block.has_children) {
          const children = await fetchChildren(block.id);
          text = children
            .filter((c: any) => c.type === "paragraph")
            .map((c: any) => richTextToString(c.paragraph.rich_text))
            .join(" ");
        }
        if (text) result.push({ type: "quote", text });

        break;
      }
      case "bulleted_list_item": {
        let html = richTextToHtml(block.bulleted_list_item.rich_text);
        if (!html) break;
        if (block.has_children) {
          const children = await fetchChildren(block.id);
          const subItems = children
            .filter((c: any) => c.type === "bulleted_list_item" || c.type === "numbered_list_item")
            .map((c: any) => {
              const key = c.type === "bulleted_list_item" ? "bulleted_list_item" : "numbered_list_item";
              return `<li>${richTextToHtml(c[key].rich_text)}</li>`;
            })
            .join("");
          if (subItems) html += `<ul class="sub-list">${subItems}</ul>`;
        }
        const lastB = result[result.length - 1];
        if (lastB?.type === "bullet_list") {
          lastB.items.push(html);
        } else {
          result.push({ type: "bullet_list", items: [html] });
        }
        break;
      }
      case "numbered_list_item": {
        let html = richTextToHtml(block.numbered_list_item.rich_text);
        if (!html) break;
        if (block.has_children) {
          const children = await fetchChildren(block.id);
          const subItems = children
            .filter((c: any) => c.type === "bulleted_list_item" || c.type === "numbered_list_item")
            .map((c: any) => {
              const key = c.type === "bulleted_list_item" ? "bulleted_list_item" : "numbered_list_item";
              return `<li>${richTextToHtml(c[key].rich_text)}</li>`;
            })
            .join("");
          if (subItems) html += `<ul class="sub-list">${subItems}</ul>`;
        }
        const lastN = result[result.length - 1];
        if (lastN?.type === "numbered_list") {
          lastN.items.push(html);
        } else {
          result.push({ type: "numbered_list", items: [html] });
        }
        break;
      }
      case "equation": {
        const text = block.equation?.expression;
        if (text) result.push({ type: "callout", text });
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
    const blocks = await fetchChildren(id);
    return await parseBlocks(blocks);
  } catch {
    return [];
  }
}
