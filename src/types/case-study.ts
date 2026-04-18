export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  summary: string;
  client: string;
  year: number;
  tags: string[];
  coverImage: string;
  content?: ContentBlock[];
}

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; url: string; alt: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] };
