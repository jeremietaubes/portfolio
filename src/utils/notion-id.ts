import { Client } from "@notionhq/client";
import type { CaseStudy, ContentBlock } from "@/types/case-study";

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });

function richTextToString(richText: any[]): string {
  return richText.map((t: any) => t.plain_text).join("");
}

const NOTION_BG_COLORS: Record<string, string> = {
  yellow_background:  "#FBF3DB",
  blue_background:    "#D3E5EF",
  green_background:   "#DDEDEA",
  red_background:     "#FFE2DD",
  purple_background:  "#E8DEEE",
  pink_background:    "#F5E0E9",
  gray_background:    "#E3E2DF",
  brown_background:   "#EEEAE4",
  orange_background:  "#FAEBDD",
};

function richTextToHtml(richText: any[]): string {
  return richText.map((t: any) => {
    let text = t.plain_text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    if (t.annotations?.bold) text = `<strong>${text}</strong>`;
    if (t.annotations?.italic) text = `<em>${text}</em>`;
    const bgColor = t.annotations?.color && NOTION_BG_COLORS[t.annotations.color];
    if (bgColor) text = `<mark style="background:${bgColor};border-radius:3px;padding:0 2px;">${text}</mark>`;
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

// Pre-fetches all nested children in 2 parallel rounds before parsing,
// so parseBlocks never needs to make serial API calls.
async function buildPrefetchMap(blocks: any[]): Promise<Map<string, any[]>> {
  const map = new Map<string, any[]>();

  // Round 2: all direct children in parallel
  const withChildren = blocks.filter((b) => b.has_children);
  const level1 = await Promise.all(
    withChildren.map(async (b) => ({ id: b.id, type: b.type, children: await fetchChildren(b.id) }))
  );
  for (const { id, children } of level1) map.set(id, children);

  // Round 3: column children in parallel
  const columnBlocks = level1
    .filter(({ type }) => type === "column_list")
    .flatMap(({ children }) => children.filter((c: any) => c.type === "column"));

  if (columnBlocks.length > 0) {
    const level2 = await Promise.all(
      columnBlocks.map(async (col: any) => ({ id: col.id, children: await fetchChildren(col.id) }))
    );
    for (const { id, children } of level2) map.set(id, children);
  }

  return map;
}

const CARD_ICONS: [RegExp, string][] = [
  [/strat/i,  "🎯"],
  [/craft/i,  "⚡"],
  [/manag/i,  "🤝"],
];

function cardIcon(title: string): string {
  const match = CARD_ICONS.find(([re]) => re.test(title));
  return match ? `<span class="card-h3-icon">${match[1]}</span>` : "";
}

async function parseBlocks(blocks: any[], prefetch: Map<string, any[]> = new Map()): Promise<ContentBlock[]> {
  const result: ContentBlock[] = [];
  let inCard = false;
  let cardHeader = "";
  const cardBody: string[] = [];

  function flushCard() {
    if (!cardHeader && !cardBody.length) return;
    const content =
      (cardHeader ? `<div class="card-header">${cardHeader}</div>` : "") +
      (cardBody.length ? `<div class="card-body"><ul>${cardBody.map(i => `<li>${i}</li>`).join("")}</ul></div>` : "");
    cardHeader = "";
    cardBody.length = 0;
    const last = result[result.length - 1];
    if (last?.type === "card_group") {
      last.items.push(content);
    } else {
      result.push({ type: "card_group", items: [content] });
    }
  }

  for (const block of blocks) {
    switch (block.type) {
      case "heading_2": {
        const text = richTextToString(block.heading_2.rich_text);
        if (!text) break;
        if (inCard) { cardHeader = `<h3 class="card-h3">${cardIcon(text)}${text}</h3>`; break; }
        result.push({ type: "heading", text });
        break;
      }
      case "heading_3": {
        const text = richTextToString(block.heading_3.rich_text);
        if (!text) break;
        if (inCard) { cardHeader = `<h3 class="card-h3">${cardIcon(text)}${text}</h3>`; break; }
        result.push({ type: "heading3", text });
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
          const children = prefetch.get(block.id) ?? await fetchChildren(block.id);
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
        if (plain === "[card]") {
          inCard = true;
          cardHeader = "";
          cardBody.length = 0;
          break;
        }
        if (plain === "[/card]") {
          inCard = false;
          flushCard();
          break;
        }
        if (inCard) {
          const html = richTextToHtml(block.paragraph.rich_text);
          if (html) cardBody.push(html);
          break;
        }
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
        let text = richTextToHtml(block.quote.rich_text);
        if (!text && block.has_children) {
          const children = prefetch.get(block.id) ?? await fetchChildren(block.id);
          text = children
            .filter((c: any) => c.type === "paragraph")
            .map((c: any) => richTextToHtml(c.paragraph.rich_text))
            .join("<br>");
        }
        if (text) result.push({ type: "quote", text });
        break;
      }
      case "bulleted_list_item": {
        let html = richTextToHtml(block.bulleted_list_item.rich_text);
        if (!html) break;
        if (inCard) { cardBody.push(html); break; }
        if (block.has_children) {
          const children = prefetch.get(block.id) ?? await fetchChildren(block.id);
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
          const prev = result[result.length - 1];
          let caption: string | undefined;
          if (prev?.type === "paragraph" && prev.text.trim() === "[pills]") {
            caption = result.pop()!.text;
          }
          result.push({ type: "bullet_list", items: [html], caption });
        }
        break;
      }
      case "numbered_list_item": {
        let html = richTextToHtml(block.numbered_list_item.rich_text);
        if (!html) break;
        if (block.has_children) {
          const children = prefetch.get(block.id) ?? await fetchChildren(block.id);
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
      case "divider": {
        result.push({ type: "divider" });
        break;
      }
      case "column_list": {
        const columnBlocks = prefetch.get(block.id) ?? await fetchChildren(block.id);
        const columns = await Promise.all(
          columnBlocks
            .filter((c: any) => c.type === "column")
            .map(async (col: any) => {
              const colBlocks = prefetch.get(col.id) ?? await fetchChildren(col.id);
              return parseBlocks(colBlocks, prefetch);
            })
        );
        result.push({ type: "column_list", columns });
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

const CACHE_TTL = import.meta.env.DEV ? 0 : 300_000;
const contentCache = new Map<string, { data: ContentBlock[]; ts: number }>();
const titleCache = new Map<string, { data: string; ts: number }>();

export async function getPageTitle(id: string): Promise<string> {
  if (!import.meta.env.NOTION_API_KEY) return "";
  const cached = titleCache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  try {
    const page = await notion.pages.retrieve({ page_id: id }) as any;
    const titleProp = Object.values(page.properties as Record<string, any>).find(
      (p: any) => p.type === "title"
    ) as any;
    const data = richTextToString(titleProp?.title ?? []);
    titleCache.set(id, { data, ts: Date.now() });
    return data;
  } catch {
    return "";
  }
}

export async function getContentById(id: string): Promise<ContentBlock[]> {
  if (!import.meta.env.NOTION_API_KEY) return [];
  const cached = contentCache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  try {
    const blocks = await fetchChildren(id);
    const prefetch = await buildPrefetchMap(blocks);
    const data = await parseBlocks(blocks, prefetch);
    contentCache.set(id, { data, ts: Date.now() });
    return data;
  } catch {
    return [];
  }
}
