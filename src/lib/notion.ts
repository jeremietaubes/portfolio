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
    challenge:
      "Users were abandoning transfers mid-flow due to unclear navigation and excessive steps.",
    solution:
      "We conducted 20 user interviews, mapped existing flows, and redesigned the transfer journey from 7 steps to 3.",
    outcome:
      "40% reduction in drop-off, CSAT improved from 3.2 to 4.6 in 3 months post-launch.",
    content: [
      {
        type: "heading",
        text: "Research phase",
      },
      {
        type: "paragraph",
        text: "We started with a heuristic audit identifying 12 usability issues, then validated them through moderated sessions with 20 participants.",
      },
      {
        type: "heading",
        text: "Design & iteration",
      },
      {
        type: "paragraph",
        text: "Three prototype rounds were tested before reaching the final version, with a strong focus on accessibility (WCAG AA).",
      },
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
    challenge:
      "Three product teams were working with divergent components, creating inconsistencies across the platform.",
    solution:
      "Creation of a centralized design system with 80+ components documented in Figma and Storybook.",
    outcome:
      "50% faster handoffs, 30% fewer design QA rounds, and adoption by all product teams within 6 months.",
    content: [
      {
        type: "heading",
        text: "Audit & foundations",
      },
      {
        type: "paragraph",
        text: "We inventoried all components across the three products — 230 unique elements reduced to 80 reusable components.",
      },
    ],
  },
  {
    id: "3",
    slug: "ecommerce-conversion",
    title: "Conversion optimization for an e-commerce site",
    summary:
      "Data-driven UX improvements increasing the conversion rate from 1.8% to 3.1%.",
    client: "ModeMaison",
    year: 2023,
    tags: ["E-commerce", "CRO", "A/B Testing"],
    coverImage: "https://placehold.co/800x450/16213e/ffffff?text=ModeMaison",
    challenge:
      "A high cart abandonment rate (78%) and low product page conversion despite strong traffic.",
    solution:
      "Funnel analysis, 8 A/B tests on product pages and checkout, and redesign of the micro-interaction layer.",
    outcome:
      "Conversion rate up from 1.8% to 3.1%, cart abandonment down 22%, revenue +41% over 6 months.",
    content: [
      {
        type: "heading",
        text: "Data analysis",
      },
      {
        type: "paragraph",
        text: "Session recordings and heatmaps revealed that 60% of users left the product page without scrolling to the CTA.",
      },
    ],
  },
];

// ─── Notion helpers ────────────────────────────────────────────────────────

function richTextToString(richText: any[]): string {
  return richText.map((t: any) => t.plain_text).join("");
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
      : pageToSlug(richTextToString(props.Title.title)),
    title: richTextToString(props.Title.title),
    summary: richTextToString(props.Summary?.rich_text ?? []),
    client: richTextToString(props.Client?.rich_text ?? []),
    year: props.Year?.number ?? new Date().getFullYear(),
    tags: props.Tags?.multi_select?.map((t: any) => t.name) ?? [],
    coverImage: props.CoverImage?.url ?? "",
    challenge: richTextToString(props.Challenge?.rich_text ?? []),
    solution: richTextToString(props.Solution?.rich_text ?? []),
    outcome: richTextToString(props.Outcome?.rich_text ?? []),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getAllCaseStudies(): Promise<CaseStudy[]> {
  if (!import.meta.env.NOTION_API_KEY) {
    return MOCK_CASE_STUDIES;
  }

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "Published",
      checkbox: { equals: true },
    },
    sorts: [{ property: "Year", direction: "descending" }],
  });

  return response.results.map(notionPageToCaseStudy);
}

export async function getCaseStudyBySlug(
  slug: string
): Promise<CaseStudy | undefined> {
  if (!import.meta.env.NOTION_API_KEY) {
    return MOCK_CASE_STUDIES.find((cs) => cs.slug === slug);
  }

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "Slug",
      rich_text: { equals: slug },
    },
  });

  if (!response.results.length) return undefined;

  const page = response.results[0] as any;
  const caseStudy = notionPageToCaseStudy(page);

  // Fetch page blocks for rich content
  const blocks = await notion.blocks.children.list({ block_id: page.id });
  caseStudy.content = blocks.results
    .map((block: any): ContentBlock | null => {
      switch (block.type) {
        case "paragraph":
          return {
            type: "paragraph",
            text: richTextToString(block.paragraph.rich_text),
          };
        case "heading_2":
          return {
            type: "heading",
            text: richTextToString(block.heading_2.rich_text),
          };
        case "quote":
          return {
            type: "quote",
            text: richTextToString(block.quote.rich_text),
          };
        case "image":
          return {
            type: "image",
            url:
              block.image.type === "external"
                ? block.image.external.url
                : block.image.file.url,
            alt: richTextToString(block.image.caption),
          };
        default:
          return null;
      }
    })
    .filter(Boolean) as ContentBlock[];

  return caseStudy;
}
