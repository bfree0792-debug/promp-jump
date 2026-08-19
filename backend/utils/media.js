function toRelativeUploadUrl(url = "") {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url;

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    // keep original value for external URLs
  }

  return url;
}

module.exports = {
  toRelativeUploadUrl,
};
