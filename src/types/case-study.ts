export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  summary: string;
  client: string;
  year: number;
  tags: string[];
  coverImage: string;
  // Detail page fields
  challenge?: string;
  solution?: string;
  outcome?: string;
  content?: ContentBlock[];
}

export interface ContentBlock {
  type: "paragraph" | "heading" | "image" | "quote";
  text?: string;
  url?: string;
  alt?: string;
}
