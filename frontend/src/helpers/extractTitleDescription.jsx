export function extractTitleDescription(text) {
  // Remove any Markdown bold, asterisks, and trim
  text = text.replace(/\*\*/g, "").trim();

  // Remove "Title:" and "Description:" prefixes if present
  text = text.replace(/^Title:\s*/i, "");
  text = text.replace(/^Description:\s*/i, "");

  // Try to split by "Description:" or line breaks
  // Pattern: title is first line, description is after "Description:" or from second line onwards
  let title = "";
  let description = "";

  // If AI used Description: as a separator
  const descMatch = text.match(/^(.*?)\s*Description:\s*(.*)$/is);
  if (descMatch) {
    title = descMatch[1].trim();
    description = descMatch[2].trim();
  } else {
    // Otherwise, split by lines and treat the first as title, rest as description
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    title = lines[0] || "";
    description = lines.slice(1).join(" ").trim();
  }

  // Remove any residual "Title:" or "Description:" in either field
  title = title
    .replace(/^Title:\s*/i, "")
    .replace(/^Description:\s*/i, "")
    .trim();
  description = description
    .replace(/^Title:\s*/i, "")
    .replace(/^Description:\s*/i, "")
    .trim();

  return { title, description };
}
