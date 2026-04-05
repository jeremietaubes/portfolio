import { Client } from "@notionhq/client";
import { readFileSync } from "fs";

// Load .env manually
const env = readFileSync(".env", "utf8");
const getEnv = (key) => env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim() ?? "";

const notion = new Client({ auth: getEnv("NOTION_API_KEY") });
const DATABASE_ID = getEnv("NOTION_DATABASE_ID");

const MOCK_CASE_STUDIES = [
  {
    slug: "redesign-app-mobile",
    title: "Redesign of a mobile banking app",
    summary: "Full UX overhaul reducing friction in key user flows by 40% and improving CSAT from 3.2 to 4.6.",
    client: "FinBank",
    year: 2024,
    tags: ["UX Design", "Mobile", "Finance"],
    coverImage: "https://placehold.co/800x450/1a1a2e/ffffff?text=FinBank",
    challenge: "Users were abandoning transfers mid-flow due to unclear navigation and excessive steps.",
    solution: "We conducted 20 user interviews, mapped existing flows, and redesigned the transfer journey from 7 steps to 3.",
    outcome: "40% reduction in drop-off, CSAT improved from 3.2 to 4.6 in 3 months post-launch.",
  },
  {
    slug: "design-system-saas",
    title: "Design system for a B2B SaaS",
    summary: "Building a scalable component library cutting design-to-dev handoff time in half.",
    client: "DataFlow",
    year: 2023,
    tags: ["Design System", "B2B", "Figma"],
    coverImage: "https://placehold.co/800x450/0f3460/ffffff?text=DataFlow",
    challenge: "Three product teams were working with divergent components, creating inconsistencies across the platform.",
    solution: "Creation of a centralized design system with 80+ components documented in Figma and Storybook.",
    outcome: "50% faster handoffs, 30% fewer design QA rounds, and adoption by all product teams within 6 months.",
  },
  {
    slug: "ecommerce-conversion",
    title: "Conversion optimization for an e-commerce site",
    summary: "Data-driven UX improvements increasing the conversion rate from 1.8% to 3.1%.",
    client: "ModeMaison",
    year: 2023,
    tags: ["E-commerce", "CRO", "A/B Testing"],
    coverImage: "https://placehold.co/800x450/16213e/ffffff?text=ModeMaison",
    challenge: "A high cart abandonment rate (78%) and low product page conversion despite strong traffic.",
    solution: "Funnel analysis, 8 A/B tests on product pages and checkout, and redesign of the micro-interaction layer.",
    outcome: "Conversion rate up from 1.8% to 3.1%, cart abandonment down 22%, revenue +41% over 6 months.",
  },
];

async function seed() {
  console.log(`Seeding ${MOCK_CASE_STUDIES.length} case studies into Notion...\n`);

  for (const cs of MOCK_CASE_STUDIES) {
    try {
      await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          Nom: { title: [{ text: { content: cs.title } }] },
          Slug: { rich_text: [{ text: { content: cs.slug } }] },
          Summary: { rich_text: [{ text: { content: cs.summary } }] },
          Client: { rich_text: [{ text: { content: cs.client } }] },
          Year: { number: cs.year },
          Tags: { multi_select: cs.tags.map((name) => ({ name })) },
          CoverImage: { url: cs.coverImage },
          Challenge: { rich_text: [{ text: { content: cs.challenge } }] },
          Solution: { rich_text: [{ text: { content: cs.solution } }] },
          Outcome: { rich_text: [{ text: { content: cs.outcome } }] },
          Published: { checkbox: true },
        },
      });
      console.log(`✓ ${cs.title}`);
    } catch (e) {
      console.error(`✗ ${cs.title} — ${e.message}`);
    }
  }

  console.log("\nDone.");
}

seed();
