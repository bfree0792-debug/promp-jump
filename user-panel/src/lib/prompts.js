export function isPremiumAccess(access) {
  return access === "Pro" || access === "Team";
}

export function isFreeAccess(access) {
  return access === "Free";
}

export function isPublishedPrompt(prompt) {
  return prompt.status === "Published" && prompt.access !== "Unassigned";
}

export function matchesPromptSearch(prompt, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    prompt.title,
    prompt.description,
    prompt.category,
    prompt.type,
    prompt.access,
    prompt.status,
    ...(Array.isArray(prompt.tags) ? prompt.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}
