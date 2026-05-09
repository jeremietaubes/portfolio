import { Client } from "@notionhq/client";
import type { CaseStudy, ContentBlock } from "@/types/case-study";

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

// ─── Mock data (used when NOTION_API_KEY is not set) ───────────────────────

const MOCK_CASE_STUDIES: CaseStudy[] = [
  {
    id: "1",
    slug: "redesign-app-mobile",
    title: "Redesign of a mobile banking app",
    summary:
      "Full UX overhaul reducing friction in key user flows by 40% and improving CSAT from 3.2 to 4.6.",
    client: "FinBank",
    year: 2024,
    tags: ["UX Design", "Mobile", "Finance"],
    coverImage: "https://placehold.co/800x450/1a1a2e/ffffff?text=FinBank",
    content: [
      { type: "heading", text: "Contexte" },
      { type: "paragraph", text: "FinBank is a neobank serving 2M users in France. Despite strong growth, user satisfaction scores were declining due to a dated mobile experience." },
      { type: "heading", text: "Problème" },
      { type: "paragraph", text: "Users were abandoning transfers mid-flow due to unclear navigation and excessive steps. The average transfer took 7 steps and had a 42% drop-off rate." },
      { type: "heading", text: "Processus" },
      { type: "paragraph", text: "We started with a heuristic audit identifying 12 usability issues, then validated them through moderated sessions with 20 participants." },
      { type: "bullet_list", items: ["20 user interviews conducted", "Heuristic audit — 12 issues identified", "3 prototype rounds tested", "Accessibility review (WCAG AA)"] },
      { type: "heading", text: "Solution" },
      { type: "paragraph", text: "We redesigned the transfer journey from 7 steps to 3, with clear progress indicators and inline error handling." },
      { type: "heading", text: "Résultats" },
      { type: "bullet_list", items: ["40% reduction in drop-off rate", "CSAT improved from 3.2 to 4.6 in 3 months post-launch", "Transfer completion time reduced by 55%"] },
    ],
  },
  {
    id: "2",
    slug: "design-system-saas",
    title: "Design system for a B2B SaaS",
    summary:
      "Building a scalable component library cutting design-to-dev handoff time in half.",
    client: "DataFlow",
    year: 2023,
    tags: ["Design System", "B2B", "Figma"],
    coverImage: "https://placehold.co/800x450/0f3460/ffffff?text=DataFlow",
    content: [
      { type: "heading", text: "Contexte" },
      { type: "paragraph", text: "DataFlow is a B2B analytics platform with three separate product teams working independently, leading to visual inconsistencies across the product." },
      { type: "heading", text: "Problème" },
      { type: "paragraph", text: "Three product teams were working with divergent components, creating inconsistencies and slowing down design-to-dev handoffs significantly." },
      { type: "heading", text: "Processus" },
      { type: "paragraph", text: "We inventoried all components across the three products — 230 unique elements reduced to 80 reusable components." },
      { type: "heading", text: "Solution" },
      { type: "paragraph", text: "Creation of a centralized design system with 80+ components documented in Figma and Storybook, with contribution guidelines for all teams." },
      { type: "heading", text: "Résultats" },
      { type: "bullet_list", items: ["50% faster handoffs", "30% fewer design QA rounds", "Adopted by all product teams within 6 months"] },
    ],
  },
];

// ─── Notion helpers ────────────────────────────────────────────────────────

function richTextToString(richText: any[]): string {
  return richText.map((t: any) => t.plain_text).join("");
}

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

function pageToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function notionPageToCaseStudy(page: any): CaseStudy {
  const props = page.properties;

  return {
    id: page.id,
    slug: props.Slug?.rich_text?.length
      ? richTextToString(props.Slug.rich_text)
      : pageToSlug(richTextToString(props.Nom.title)),
    title: richTextToString(props.Nom.title),
    summary: richTextToHtml(props.Summary?.rich_text ?? []),
    client: richTextToString(props.Client?.rich_text ?? []),
    year: richTextToString(props.Year?.rich_text ?? []),
    tags: props.Tags?.multi_select?.map((t: any) => t.name) ?? [],
    coverImage: (() => {
      // Champ Text (rich_text) : nom de fichier local, ex: "finbank-cover.webp"
      if (props.CoverImage?.rich_text?.length) {
        const filename = richTextToString(props.CoverImage.rich_text);
        return `/images/${filename}`;
      }
      // Champ URL : nom de fichier local ou URL complète
      if (props.CoverImage?.url) {
        const val = props.CoverImage.url;
        if (val.startsWith("http")) return val;
        return `/images/${val}`;
      }
      return "";
    })(),
    location: richTextToString(props.Location?.rich_text ?? []),
    order: props.Order?.number ?? 999,
  };
}

async function fetchChildren(blockId: string): Promise<any[]> {
  try {
    const res = await notion.blocks.children.list({ block_id: blockId });
    return res.results;
  } catch {
    return [];
  }
}

async function parseBlocks(blocks: any[]): Promise<ContentBlock[]> {
  const result: ContentBlock[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading_2": {
        const text = richTextToString(block.heading_2.rich_text);
        if (text) result.push({ type: "heading", text });
        break;
      }
      case "heading_3": {
        const text = richTextToString(block.heading_3.rich_text);
        if (text) result.push({ type: "heading", text });
        break;
      }
      case "paragraph": {
        const text = richTextToString(block.paragraph.rich_text);
        if (text) result.push({ type: "paragraph", text });
        break;
      }
      case "quote": {
        const text = richTextToString(block.quote.rich_text);
        if (text) result.push({ type: "quote", text });
        break;
      }
      case "bulleted_list_item": {
        let text = richTextToString(block.bulleted_list_item.rich_text);
        if (!text) break;
        if (block.has_children) {
          const children = await fetchChildren(block.id);
          const subItems = children
            .filter((c: any) => c.type === "bulleted_list_item" || c.type === "numbered_list_item")
            .map((c: any) => {
              const key = c.type === "bulleted_list_item" ? "bulleted_list_item" : "numbered_list_item";
              return `<li>${richTextToString(c[key].rich_text)}</li>`;
            })
            .join("");
          if (subItems) text += `<ul class="sub-list">${subItems}</ul>`;
        }
        const lastB = result[result.length - 1];
        if (lastB?.type === "bullet_list") {
          lastB.items.push(text);
        } else {
          result.push({ type: "bullet_list", items: [text] });
        }
        break;
      }
      case "numbered_list_item": {
        let text = richTextToString(block.numbered_list_item.rich_text);
        if (!text) break;
        if (block.has_children) {
          const children = await fetchChildren(block.id);
          const subItems = children
            .filter((c: any) => c.type === "bulleted_list_item" || c.type === "numbered_list_item")
            .map((c: any) => {
              const key = c.type === "bulleted_list_item" ? "bulleted_list_item" : "numbered_list_item";
              return `<li>${richTextToString(c[key].rich_text)}</li>`;
            })
            .join("");
          if (subItems) text += `<ul class="sub-list">${subItems}</ul>`;
        }
        const lastN = result[result.length - 1];
        if (lastN?.type === "numbered_list") {
          lastN.items.push(text);
        } else {
          result.push({ type: "numbered_list", items: [text] });
        }
        break;
      }
      case "callout": {
        const plain = richTextToString(block.callout.rich_text);
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
      case "equation": {
        const text = block.equation?.expression;
        if (text) result.push({ type: "callout", text });
        break;
      }
      case "image": {
        const alt = richTextToString(block.image.caption);
        const url = alt ? `/images/${alt}` : (
          block.image.type === "external"
            ? block.image.external.url
            : block.image.file.url
        );
        result.push({ type: "image", url, alt });
        break;
      }
    }
  }

  return result;
}

// ─── Cache ─────────────────────────────────────────────────────────────────

let cacheAll: { data: CaseStudy[]; ts: number } | null = null;
const CACHE_TTL = import.meta.env.DEV ? 0 : 60_000;

// ─── Public API ────────────────────────────────────────────────────────────

export async function getAllCaseStudies(): Promise<CaseStudy[]> {
  if (!import.meta.env.NOTION_API_KEY || !import.meta.env.NOTION_DATABASE_ID) {
    return MOCK_CASE_STUDIES;
  }

  if (cacheAll && Date.now() - cacheAll.ts < CACHE_TTL) return cacheAll.data;

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Published",
        checkbox: { equals: true },
      },
    });

    const data = response.results
      .map(notionPageToCaseStudy)
      .sort((a, b) => a.order - b.order);
    cacheAll = { data, ts: Date.now() };
    return data;
  } catch (err) {
    console.warn("[notion] getAllCaseStudies failed, using mock data:", (err as Error).message);
    return MOCK_CASE_STUDIES;
  }
}

export async function getCaseStudyBySlug(
  slug: string
): Promise<CaseStudy | undefined> {
  const all = await getAllCaseStudies();
  return all.find((cs) => cs.slug === slug);
}
