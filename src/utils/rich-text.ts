// Conversion du texte riche Notion en HTML. Source unique, utilisée par lib/notion.ts et utils/notion-id.ts.
const NOTION_BG_COLORS: Record<string, string> = {
  yellow_background:  "#F0EEE8",
  blue_background:    "#D3E5EF",
  green_background:   "#DDEDEA",
  red_background:     "#FFE2DD",
  purple_background:  "#E8DEEE",
  pink_background:    "#F5E0E9",
  gray_background:    "#E3E2DF",
  brown_background:   "#EEEAE4",
  orange_background:  "#FAEBDD",
};

export function richTextToHtml(richText: any[]): string {
  return richText.map((t: any) => {
    let text = t.plain_text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    if (t.annotations?.bold) text = `<strong>${text}</strong>`;
    if (t.annotations?.italic) text = `<em>${text}</em>`;
    if (t.annotations?.underline) text = `<u>${text}</u>`;
    const bgColor = t.annotations?.color && NOTION_BG_COLORS[t.annotations.color];
    if (bgColor) text = `<mark style="background:${bgColor};border-radius:3px;padding:0 2px;">${text}</mark>`;
    return text;
  }).join("");
}
