export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  summary: string;
  client: string;
  year: string;
  tags: string[];
  coverImage: string;
  location: string;
  order: number;
  content?: ContentBlock[];
}

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; url: string; alt: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "callout"; text: string; emoji?: string }
  | { type: "numbered_item"; num: string; text: string };
